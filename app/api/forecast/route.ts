export const dynamic = 'force-dynamic'

import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO } from "date-fns"
import { RecurringTransactionFrequency, TransactionStream } from "plaid"
import plaidClient from "@/app/lib/plaid"
import { accounts } from "@/app/lib/mongodb"
import { HOUSEHOLD_ID } from "@/app/lib/household"
import { listUser, User } from "@/app/queries/users"
import { listCategories } from "@/app/queries/categories"
import { getBudgetAccountMatch } from "@/app/queries/accounts"
import {
  getForecastSettings,
  getPreviousSnapshot,
  getStreamDetails,
  getUncategorizedSpent,
  listPaySchedules,
  listPostedTransactions,
  listScheduled,
  listStreamOverrides,
  saveSnapshot,
} from "@/app/queries/forecast"
import {
  diffSnapshots,
  expandOccurrences,
  expandPaySchedule,
  ForecastSnapshot,
  LATE_GRACE_DAYS,
  MATCH_DAYS_EARLY,
  matchOccurrence,
  safeToSpend,
  spreadBudget,
} from "@/app/lib/forecast"
import { Category } from "@/app/interfaces/categories"
import {
  BillAmountMode,
  BudgetPlanCategory,
  BudgetPlanMonth,
  COMMITTED_SOURCES,
  ForecastEvent,
  ForecastFrequency,
  ForecastResponse,
  ForecastStream,
  PaidOccurrence,
} from "@/app/interfaces/forecast"

const MAX_DAYS = 90
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
// Without a pay schedule, a reliable deposit at least this big marks payday.
const PAYCHECK_MIN = 500
// A recurring item Plaid saw this recently is listed as "paid recently".
const RECENTLY_PAID_DAYS = 10
// How far ahead a snapshot records items, for "what changed".
const SNAPSHOT_DAYS = 30

const iso = (date: Date) => format(date, 'yyyy-MM-dd')
const shiftDays = (date: string, days: number) => iso(addDays(parseISO(date), days))
const round2 = (value: number) => Math.round(value * 100) / 100

// Events for one account from today through `days` ahead.
// - Committed: Plaid recurring bills and income (after overrides), pay
//   schedules, and scheduled items. These draw the balance line and set
//   "safe to spend". An occurrence already found among posted transactions is
//   paid and not forecast again; one past due and not found is late (today).
// - Estimated: remaining budget, spread over the month (off by default).
// Plaid tokens stay on the server.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const account_id = searchParams.get('account_id')
    const days = Math.min(Math.max(Number(searchParams.get('days')) || 30, 1), MAX_DAYS)
    // The browser sends its local date; the server may be in another time zone.
    const fromParam = searchParams.get('from')
    const from = fromParam && ISO_DATE.test(fromParam) ? fromParam : iso(new Date())
    const to = shiftDays(from, days)

    if (!account_id) return Response.json({ message: 'account_id is required' }, { status: 400 })

    const account = await accounts.findOne({ account_id })
    if (!account) return Response.json({ message: `Unknown account ${account_id}` }, { status: 404 })

    const user = await listUser({ userId: HOUSEHOLD_ID }) as User | null
    const item = user?.items?.find(i => i.item_id === account.item_id)
    if (!item) {
      return Response.json({ message: 'Forecasts need a Plaid-linked account.' }, { status: 400 })
    }

    const [balanceRes, recurringRes, overrides, scheduled, paySchedules, settings, posted, previousSnapshot] = await Promise.all([
      plaidClient.accountsGet({ access_token: item.plaidAccessToken, options: { account_ids: [account_id] } }),
      plaidClient.transactionsRecurringGet({ access_token: item.plaidAccessToken, account_ids: [account_id] }),
      listStreamOverrides(),
      listScheduled(account_id),
      listPaySchedules(account_id),
      getForecastSettings(account_id),
      listPostedTransactions(account_id, shiftDays(from, -45)),
      getPreviousSnapshot(account_id, from),
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
    const plaidById = new Map(plaidStreams.map(s => [s.stream_id, s]))

    const overrideById = new Map(overrides.map(o => [o.stream_id, o]))
    const details = await getStreamDetails(plaidStreams)
    const replacedBy = new Map(paySchedules.filter(p => p.replacesStreamId).map(p => [p.replacesStreamId!, p]))

    const streams: ForecastStream[] = plaidStreams.flatMap(s => {
      const override = overrideById.get(s.stream_id)
      const detail = details.get(s.stream_id)
      const recentAmounts = detail?.recentAmounts ?? []
      // An amount set by hand is fixed; otherwise average the last few, so a
      // variable bill doesn't jump with each statement.
      const amountMode: BillAmountMode = override?.amountMode ?? (override?.amount != null ? 'fixed' : 'average')
      const last = s.last_amount.amount ?? s.average_amount.amount ?? 0
      const amount = amountMode === 'fixed' && override?.amount != null
        ? override.amount
        : amountMode === 'average' && recentAmounts.length
          ? round2(recentAmounts.reduce((sum, a) => sum + a, 0) / recentAmounts.length)
          : last
      // Plaid's prediction for the next date; a stream with no prediction
      // repeats from its last date.
      const nextDate = override?.nextDate ?? s.predicted_next_date ?? s.last_date
      if (!nextDate) return []
      return [{
        streamId: s.stream_id,
        name: s.merchant_name || s.description,
        amount,
        frequency: s.frequency as ForecastFrequency,
        nextDate,
        confidence: s.status === 'MATURE' ? 'high' : 'low',
        categoryName: detail?.categoryName,
        logoUrl: detail?.logoUrl,
        hidden: !!override?.hidden,
        overridden: override?.amount != null || override?.nextDate != null || override?.amountMode != null,
        lastDate: s.last_date,
        amountMode,
        recentAmounts,
        ...replacedBy.has(s.stream_id) ? { replacedByPaySchedule: replacedBy.get(s.stream_id)!.name } : {},
      }]
    })

    const paid: PaidOccurrence[] = []
    const used = new Set<string>()

    // The first expected occurrence of a recurring item decides whether it is
    // paid already (posted in the match window), late (past due, not found,
    // within the grace period: expected today) or still due. Later
    // occurrences follow the schedule.
    const resolveFirst = (opts: {
      key: string
      expectedDate: string
      expectedAmount: number
      names: string[]
      transactionIds?: Set<string>
      event: Omit<ForecastEvent, 'date'>
    }): { paidOccurrence?: PaidOccurrence, lateEvent?: ForecastEvent, skipExpected: boolean } => {
      const { key, expectedDate, expectedAmount, names, transactionIds, event } = opts
      // Only past or imminent occurrences can already have posted.
      if (expectedDate > shiftDays(from, MATCH_DAYS_EARLY)) return { skipExpected: false }
      const match = matchOccurrence({ expectedDate, expectedAmount, names, transactionIds, today: from, posted, used })
      if (match) {
        if (match.transaction_id) used.add(match.transaction_id)
        return {
          skipExpected: true,
          paidOccurrence: {
            key, name: event.name, expectedDate, postedDate: match.date, amount: match.amount,
            logoUrl: event.logoUrl, categoryName: event.categoryName, source: event.source,
          },
        }
      }
      if (expectedDate < from && differenceInCalendarDays(parseISO(from), parseISO(expectedDate)) <= LATE_GRACE_DAYS) {
        return { skipExpected: true, lateEvent: { ...event, date: from, late: true, expectedDate } }
      }
      return { skipExpected: false }
    }

    // Without a pay schedule, Plaid's reliable deposits mark paydays.
    const usePlaidPaydays = paySchedules.length === 0

    const recurringEvents: ForecastEvent[] = streams
      .filter(s => !s.hidden && !s.replacedByPaySchedule && s.frequency !== RecurringTransactionFrequency.Unknown)
      .flatMap(s => {
        const plaid = plaidById.get(s.streamId)
        const event = {
          amount: s.amount,
          name: s.name,
          source: 'recurring' as const,
          confidence: s.confidence,
          streamId: s.streamId,
          categoryName: s.categoryName,
          logoUrl: s.logoUrl,
          ...usePlaidPaydays && s.amount <= -PAYCHECK_MIN && s.confidence === 'high' ? { paycheck: true } : {},
        }
        const first = resolveFirst({
          key: s.streamId,
          expectedDate: s.nextDate,
          expectedAmount: s.amount,
          names: [s.name, plaid?.description ?? '', plaid?.merchant_name ?? ''],
          transactionIds: new Set(plaid?.transaction_ids ?? []),
          event,
        })
        if (first.paidOccurrence) paid.push(first.paidOccurrence)
        const dates = expandOccurrences(s.nextDate, s.frequency, from, to)
          .filter(date => !(first.skipExpected && date === s.nextDate))
        return [...first.lateEvent ? [first.lateEvent] : [], ...dates.map(date => ({ ...event, date }))]
      })

    // Recently posted recurring items Plaid has already moved past, for the
    // "Paid recently" list (not counted anywhere).
    for (const s of streams) {
      if (s.hidden || paid.some(p => p.key === s.streamId) || !s.lastDate) continue
      if (s.lastDate > from || differenceInCalendarDays(parseISO(from), parseISO(s.lastDate)) > RECENTLY_PAID_DAYS) continue
      const plaid = plaidById.get(s.streamId)
      paid.push({
        key: s.streamId, name: s.name, expectedDate: s.lastDate, postedDate: s.lastDate,
        amount: plaid?.last_amount.amount ?? s.amount, logoUrl: s.logoUrl, categoryName: s.categoryName, source: 'recurring',
      })
    }

    // --- Pay schedules -------------------------------------------------------
    const paycheckEvents: ForecastEvent[] = paySchedules.flatMap(schedule => {
      const replaced = schedule.replacesStreamId ? plaidById.get(schedule.replacesStreamId) : undefined
      const event = {
        amount: -schedule.amount,
        name: schedule.name,
        source: 'paycheck' as const,
        confidence: 'high' as const,
        payScheduleId: String(schedule._id),
        paycheck: true,
        logoUrl: replaced ? details.get(replaced.stream_id)?.logoUrl : undefined,
      }
      const names = [schedule.name, replaced?.description ?? '', replaced?.merchant_name ?? '']
      const transactionIds = new Set(replaced?.transaction_ids ?? [])
      const events: ForecastEvent[] = []
      // Recent paydays decide paid/late; the rest are simply expected.
      for (const date of expandPaySchedule(schedule, shiftDays(from, -LATE_GRACE_DAYS), to)) {
        if (date <= shiftDays(from, MATCH_DAYS_EARLY)) {
          const first = resolveFirst({ key: String(schedule._id), expectedDate: date, expectedAmount: -schedule.amount, names, transactionIds, event })
          if (first.paidOccurrence) paid.push(first.paidOccurrence)
          if (first.lateEvent) events.push(first.lateEvent)
          if (first.skipExpected || date < from) continue
        }
        events.push({ ...event, date })
      }
      return events
    })

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

    // --- Remaining budget (estimate only) -------------------------------------
    // Only for a checking/savings account that counts toward the budget:
    // budgeted spending comes out of the account the budget tracks.
    let budgetEvents: ForecastEvent[] = []
    let budgetPlan: BudgetPlanMonth[] | undefined
    let budgetSkippedReason: string | undefined
    if (account.type !== 'depository') {
      budgetSkippedReason = 'Budgeted spending is only estimated for checking and savings accounts.'
    } else if (!account.includeInBudget) {
      budgetSkippedReason = 'This account is excluded from the budget, so budgeted spending isn\'t estimated for it.'
    } else {
      budgetPlan = await getBudgetPlan(from, to, recurringEvents)
      budgetEvents = spreadBudget(budgetPlan.map(({ month, categories, uncategorizedSpent }) => {
        // Uncategorized spending already left the balance: take it off what's
        // left, in proportion, instead of expecting it again.
        const left = categories.reduce((sum, c) => sum + c.remaining, 0)
        const factor = left > 0 ? Math.max(0, left - uncategorizedSpent) / left : 0
        return {
          month,
          categories: categories.map(({ categoryName, remaining }) => ({ categoryName, remaining: round2(remaining * factor) })),
        }
      }), from, to)
    }

    const events = [...recurringEvents, ...paycheckEvents, ...scheduledEvents, ...budgetEvents]
      .sort((a, b) => a.date.localeCompare(b.date))
    const committed = events.filter(e => COMMITTED_SOURCES.includes(e.source))
    const safe = safeToSpend({ startBalance, events: committed, from, cushion: settings.cushion })

    // --- What changed since the last day's snapshot -----------------------------
    const snapshot = buildSnapshot(from, startBalance, safe.amount, committed, paid)
    const changes = previousSnapshot ? diffSnapshots(previousSnapshot, snapshot) : []
    await saveSnapshot(account_id, snapshot)

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
      events,
      budgetPlan,
      budgetSkippedReason,
      paid: paid.sort((a, b) => b.postedDate.localeCompare(a.postedDate)),
      paySchedules,
      settings,
      safeToSpend: safe,
      changesSince: previousSnapshot?.date ?? null,
      changes,
    }
    return Response.json(response)

  } catch (error: any) {
    const message = error?.response?.data?.error_message ?? error?.message ?? 'Forecast failed'
    console.error('Forecast failed:', message)
    return Response.json({ message }, { status: 500 })
  }
}

// Each item's next committed occurrence (within SNAPSHOT_DAYS) plus what's paid.
function buildSnapshot(from: string, startBalance: number, safe: number, committed: ForecastEvent[], paid: PaidOccurrence[]): ForecastSnapshot {
  const until = shiftDays(from, SNAPSHOT_DAYS)
  const firstByKey = new Map<string, ForecastSnapshot['items'][number]>()
  for (const e of committed) {
    const key = e.streamId ?? e.payScheduleId ?? e.scheduledId ?? e.name
    if (e.date > until || firstByKey.has(key)) continue
    firstByKey.set(key, { key, name: e.name, date: e.date, amount: e.amount, ...e.late ? { late: true } : {} })
  }
  return {
    date: from,
    startBalance,
    safeToSpend: safe,
    items: [...firstByKey.values()],
    paidKeys: paid.map(p => `${p.key}@${p.postedDate}`),
  }
}

// Each expense category's unspent budget, less recurring bills already expected
// in that category (so rent isn't counted as both a bill and budget). The
// remainder is spread over the remaining days by spreadBudget. A month with no
// budget yet reuses the current one. Returned in full so the page can show the
// math behind "Budgeted spending".
async function getBudgetPlan(from: string, to: string, recurring: ForecastEvent[]): Promise<BudgetPlanMonth[]> {
  const months: string[] = []
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = format(addDays(parseISO(`${m}-01`), 32), 'yyyy-MM')) {
    months.push(m)
  }

  const currentMonth = months[0]
  const [currentCategories, uncategorizedSpent] = await Promise.all([
    listCategories({ date: currentMonth }) as Promise<Category[]>,
    getBudgetAccountMatch().then(match => getUncategorizedSpent(currentMonth, match)),
  ])

  return Promise.all(months.map(async month => {
    const own = month === currentMonth ? currentCategories : await listCategories({ date: month }) as Category[]
    // Nothing planned yet: assume this month's budget, with nothing spent.
    const categories = own.length ? own : currentCategories.map(c => ({ ...c, spent: 0 }))

    const billsByCategory = new Map<string, BudgetPlanCategory['bills']>()
    for (const e of recurring) {
      if (e.date.slice(0, 7) !== month || e.amount <= 0 || !e.categoryName) continue
      billsByCategory.set(e.categoryName, [
        ...billsByCategory.get(e.categoryName) ?? [],
        { name: e.name, date: e.date, amount: e.amount, ...e.late ? { late: true } : {} },
      ])
    }

    const monthStart = parseISO(`${month}-01`)
    const spreadFrom = parseISO(from) > monthStart ? parseISO(from) : monthStart
    const isExpense = (c: Category) => c.type === undefined || c.type === 'deduction'

    return {
      month,
      ...own.length ? {} : { assumedFrom: currentMonth },
      daysLeft: differenceInCalendarDays(endOfMonth(monthStart), spreadFrom) + 1,
      categories: categories.filter(isExpense).map(c => {
        const categoryName = c.name ?? 'Uncategorized'
        const bills = billsByCategory.get(c.name ?? '') ?? []
        const billsTotal = round2(bills.reduce((sum, b) => sum + b.amount, 0))
        const budget = c.budget ?? 0
        const spent = round2(Math.max(0, c.spent ?? 0))
        return {
          categoryName,
          budget,
          spent,
          bills,
          billsTotal,
          remaining: round2(Math.max(0, budget - spent - billsTotal)),
        }
      }),
      excluded: categories
        .filter(c => !isExpense(c) && (c.budget ?? 0) > 0)
        .map(c => ({ categoryName: c.name ?? 'Uncategorized', type: c.type!, budget: c.budget ?? 0 })),
      uncategorizedSpent: month === currentMonth ? uncategorizedSpent : 0,
    }
  }))
}
