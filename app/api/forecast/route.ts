export const dynamic = 'force-dynamic'

import { addDays, format, parseISO } from "date-fns"
import { RecurringTransactionFrequency, TransactionStream } from "plaid"
import plaidClient from "@/app/lib/plaid"
import { accounts } from "@/app/lib/mongodb"
import { HOUSEHOLD_ID } from "@/app/lib/household"
import { listUser, User } from "@/app/queries/users"
import { listCategories } from "@/app/queries/categories"
import { getStreamDetails, listScheduled, listStreamOverrides } from "@/app/queries/forecast"
import { expandOccurrences, isLate, spreadBudget } from "@/app/lib/forecast"
import { Category } from "@/app/interfaces/categories"
import { ForecastEvent, ForecastFrequency, ForecastResponse, ForecastStream } from "@/app/interfaces/forecast"

const MAX_DAYS = 90
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Events for one account from today through `days` ahead: Plaid recurring
// streams (after the user's overrides), remaining budget spending, and
// scheduled items. The client turns these into the balance line, so toggling
// a source doesn't need another request. Plaid tokens stay on the server.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const account_id = searchParams.get('account_id')
    const days = Math.min(Math.max(Number(searchParams.get('days')) || 30, 1), MAX_DAYS)
    // The browser sends its local date; the server may be in another time zone.
    const fromParam = searchParams.get('from')
    const from = fromParam && ISO_DATE.test(fromParam) ? fromParam : format(new Date(), 'yyyy-MM-dd')
    const to = format(addDays(parseISO(from), days), 'yyyy-MM-dd')

    if (!account_id) return Response.json({ message: 'account_id is required' }, { status: 400 })

    const account = await accounts.findOne({ account_id })
    if (!account) return Response.json({ message: `Unknown account ${account_id}` }, { status: 404 })

    const user = await listUser({ userId: HOUSEHOLD_ID }) as User | null
    const item = user?.items?.find(i => i.item_id === account.item_id)
    if (!item) {
      return Response.json({ message: 'Forecasts need a Plaid-linked account.' }, { status: 400 })
    }

    const [balanceRes, recurringRes, overrides, scheduled] = await Promise.all([
      plaidClient.accountsGet({ access_token: item.plaidAccessToken, options: { account_ids: [account_id] } }),
      plaidClient.transactionsRecurringGet({ access_token: item.plaidAccessToken, account_ids: [account_id] }),
      listStreamOverrides(),
      listScheduled(account_id),
    ])

    // Available already reflects pending charges and holds; fall back to current.
    const balances = balanceRes.data.accounts[0]?.balances
    const balanceSource = balances?.available != null ? 'available' : 'current'
    const startBalance = balances?.available ?? balances?.current ?? 0
    // Only a bank-supplied balance timestamp is trustworthy: Plaid refreshes
    // balances separately from transactions, so the item's last transactions
    // update isn't when this balance was fetched. Many banks (USAA) send none.
    const balanceAsOf = balances?.last_updated_datetime ?? null

    // --- Recurring streams -------------------------------------------------
    const plaidStreams: TransactionStream[] = [
      ...recurringRes.data.inflow_streams,
      ...recurringRes.data.outflow_streams,
    ].filter(s => s.is_active && s.account_id === account_id)

    const overrideById = new Map(overrides.map(o => [o.stream_id, o]))
    const details = await getStreamDetails(plaidStreams)

    const streams: ForecastStream[] = plaidStreams.flatMap(s => {
      const override = overrideById.get(s.stream_id)
      // Prefer the latest amount (bills change) and Plaid's prediction for the
      // next date; a stream with no prediction repeats from its last date.
      const nextDate = override?.nextDate ?? s.predicted_next_date ?? s.last_date
      if (!nextDate) return []
      return [{
        streamId: s.stream_id,
        name: s.merchant_name || s.description,
        amount: override?.amount ?? s.last_amount.amount ?? s.average_amount.amount ?? 0,
        frequency: s.frequency as ForecastFrequency,
        nextDate,
        confidence: s.status === 'MATURE' ? 'high' : 'low',
        categoryName: details.get(s.stream_id)?.categoryName,
        logoUrl: details.get(s.stream_id)?.logoUrl,
        hidden: !!override?.hidden,
        overridden: override?.amount != null || override?.nextDate != null,
        lastDate: s.last_date,
      }]
    })

    const recurringEvents: ForecastEvent[] = streams
      .filter(s => !s.hidden && s.frequency !== RecurringTransactionFrequency.Unknown)
      .flatMap(s => {
        const event = {
          amount: s.amount,
          name: s.name,
          source: 'recurring' as const,
          confidence: s.confidence,
          streamId: s.streamId,
          categoryName: s.categoryName,
          logoUrl: s.logoUrl,
        }
        // A late occurrence (e.g. a deposit that's still pending at the bank)
        // is expected today; later ones follow the normal schedule.
        const late = isLate(s.nextDate, s.lastDate, from) ? [{ ...event, date: from, late: true }] : []
        return [...late, ...expandOccurrences(s.nextDate, s.frequency, from, to).map(date => ({ ...event, date }))]
      })

    // --- Remaining budget ---------------------------------------------------
    // Only for a checking/savings account that counts toward the budget:
    // budgeted spending comes out of the account the budget tracks.
    let budgetEvents: ForecastEvent[] = []
    if (account.type === 'depository' && account.includeInBudget) {
      budgetEvents = await getBudgetEvents(from, to, recurringEvents)
    }

    // --- Scheduled items ---------------------------------------------------
    const scheduledEvents: ForecastEvent[] = scheduled.flatMap(item =>
      expandOccurrences(item.date, item.frequency, from, to, item.endDate).map(date => ({
        date,
        amount: item.amount,
        name: item.name,
        source: 'scheduled' as const,
        confidence: 'high' as const,
        scheduledId: String(item._id),
      }))
    )

    const response: ForecastResponse = {
      account: {
        account_id,
        name: account.name,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
      },
      startBalance,
      balanceSource,
      balanceAsOf,
      from,
      days,
      streams,
      scheduled,
      events: [...recurringEvents, ...budgetEvents, ...scheduledEvents]
        .sort((a, b) => a.date.localeCompare(b.date)),
    }
    return Response.json(response)

  } catch (error: any) {
    const message = error?.response?.data?.error_message ?? error?.message ?? 'Forecast failed'
    console.error('Forecast failed:', message)
    return Response.json({ message }, { status: 500 })
  }
}

// Each expense category's unspent budget, less recurring bills already expected
// in that category (so rent isn't counted as both a bill and budget), spread
// over the remaining days. A month with no budget yet reuses the current one.
async function getBudgetEvents(from: string, to: string, recurring: ForecastEvent[]) {
  const months: string[] = []
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = format(addDays(parseISO(`${m}-01`), 32), 'yyyy-MM')) {
    months.push(m)
  }

  const currentMonth = months[0]
  const currentCategories = await listCategories({ date: currentMonth }) as Category[]

  const plans = await Promise.all(months.map(async month => {
    const own = month === currentMonth ? currentCategories : await listCategories({ date: month }) as Category[]
    // Nothing planned yet: assume this month's budget, with nothing spent.
    const categories = own.length ? own : currentCategories.map(c => ({ ...c, spent: 0 }))

    const recurringByCategory = new Map<string, number>()
    for (const e of recurring) {
      if (e.date.slice(0, 7) !== month || e.amount <= 0 || !e.categoryName) continue
      recurringByCategory.set(e.categoryName, (recurringByCategory.get(e.categoryName) ?? 0) + e.amount)
    }

    return {
      month,
      categories: categories
        .filter(c => c.type === undefined || c.type === 'deduction')
        .map(c => ({
          categoryName: c.name ?? 'Uncategorized',
          remaining: Math.max(0, (c.budget ?? 0) - Math.max(0, c.spent ?? 0) - (recurringByCategory.get(c.name ?? '') ?? 0)),
        })),
    }
  }))

  return spreadBudget(plans, from, to)
}
