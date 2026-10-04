'use client'

import { format, parseISO } from "date-fns"
import { ChevronRightIcon, InfoIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { BudgetPlanCategory, ForecastEvent, ForecastResponse, ForecastSource } from "@/app/interfaces/forecast"
import { Forecast } from "@/app/lib/forecast"
import ExplainSheet, { ExplainSection, ReconcileRow, Term } from "../common/ExplainSheet"
import { MerchantLogo } from "../transactions/TransactionCells"

export type ForecastKpiKey = 'safe' | 'end' | 'low' | 'flows' | 'budget'

const SOURCE_LABELS: Record<ForecastSource, string> = {
  recurring: 'Recurring bills & income',
  paycheck: 'Paychecks (your schedule)',
  budget: 'Budgeted spending',
  scheduled: 'Scheduled by you',
}

// One line item: every occurrence of the same thing from the same source.
interface ItemTotal {
  name: string
  source: ForecastSource
  logoUrl?: string | null
  dates: string[]
  total: number // positive
}

// Group events into money in / money out, then by source and item.
function summarize(events: ForecastEvent[]) {
  const group = (list: ForecastEvent[]) => {
    const items = new Map<string, ItemTotal>()
    for (const e of list) {
      const key = `${e.source}:${e.streamId ?? e.scheduledId ?? e.name}`
      const item = items.get(key) ?? { name: e.name, source: e.source, logoUrl: e.logoUrl, dates: [], total: 0 }
      item.dates.push(e.date)
      item.total += Math.abs(e.amount)
      items.set(key, item)
    }
    const bySource = new Map<ForecastSource, ItemTotal[]>()
    for (const item of items.values()) {
      bySource.set(item.source, [...(bySource.get(item.source) ?? []), item])
    }
    return [...bySource.entries()].map(([source, list]) => ({
      source,
      items: list.sort((a, b) => b.total - a.total),
      total: list.reduce((sum, i) => sum + i.total, 0),
    }))
  }

  const incoming = group(events.filter(e => e.amount < 0))
  const outgoing = group(events.filter(e => e.amount > 0))
  return {
    incoming,
    outgoing,
    totalIn: incoming.reduce((s, g) => s + g.total, 0),
    totalOut: outgoing.reduce((s, g) => s + g.total, 0),
  }
}

export interface ForecastExplainSheetProps {
  kpi: ForecastKpiKey | null
  onOpenChange: (open: boolean) => void
  data: ForecastResponse
  // Built from known (committed) items only.
  forecast: Forecast
  // Every event the server sent, including budget estimates.
  allEvents: ForecastEvent[]
  days: number
  // Whether the estimated-spending line is shown.
  showEstimates: boolean
  // Opens another explanation, e.g. budgeted spending from the flows list.
  onExplain: (kpi: ForecastKpiKey) => void
}

// The math behind the Forecast's summary cards, itemized from the same
// events that draw the chart.
export default function ForecastExplainSheet({ kpi, onOpenChange, data, forecast, allEvents: everyEvent, days, showEstimates, onExplain }: ForecastExplainSheetProps) {
  const allEvents = forecast.points.flatMap(p => p.events)
  const windowEnd = forecast.points[forecast.points.length - 1]?.date ?? data.from
  const lowIndex = forecast.points.findIndex(p => p.date === forecast.low.date)
  const eventsToLow = forecast.points.slice(0, lowIndex + 1).flatMap(p => p.events)

  let title = ''
  let description: React.ReactNode = ''
  let content: React.ReactNode = null

  switch (kpi) {
    case 'safe': {
      const safe = data.safeToSpend
      const out = safe.outflows.reduce((sum, e) => sum + e.amount, 0)
      const income = safe.inflows.reduce((sum, e) => sum - e.amount, 0)
      const computed = safe.startBalance - out + income - safe.cushion
      const until = format(parseISO(safe.windowEnd), 'EEE, MMM d')
      title = 'Safe to spend'
      description = safe.payday
        ? `What you can spend through ${until}, the day before your next paycheck, after known bills.`
        : `No payday found, so this covers the rest of the month (through ${until}).`
      content = <>
        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm leading-relaxed tabular-nums">
          <Term label={data.balanceSource === 'available' ? 'Available balance' : 'Balance'} value={safe.startBalance} />
          {' − '}<Term label="bills before payday" value={out} />
          {income > 0 && <>{' + '}<Term label="other money coming in" value={income} tone="positive" /></>}
          {safe.cushion > 0 && <>{' − '}<Term label="cushion" value={safe.cushion} /></>}
          {' = '}<Term label="safe to spend" value={computed} tone={computed < 0 ? 'negative' : undefined} />
          {safe.days > 1 && computed > 0 &&
            <div className="mt-1 text-muted-foreground">
              About {toCurrency(safe.perDay)} a day for the {safe.days} days through {until}.
            </div>
          }
        </div>
        <EventList
          title={`Bills before payday · ${toCurrency(out)}`}
          events={safe.outflows}
          empty="No known bills before payday."
        />
        {safe.inflows.length > 0 &&
          <EventList title={`Other money coming in · ${toCurrency(income)}`} events={safe.inflows} incoming />
        }
        <ExplainSection title="How it's measured">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              The balance is the {data.balanceSource} balance your bank last reported to Plaid
              {data.balanceAsOf ? ` (${format(new Date(data.balanceAsOf), 'MMM d, h:mm a')})` : ''}.
              Some banks include pending charges in it without sharing them, so a bill due today may already be in it.
            </li>
            <li>
              Bills that already posted this cycle are matched to their transactions and not counted again. A bill past its
              usual date that hasn&apos;t posted is counted today, to be safe.
            </li>
            <li>
              {safe.payday
                ? `Your next paycheck${safe.paydayName ? ` (${safe.paydayName})` : ''} on ${format(parseISO(safe.payday), 'MMM d')} ends the window; it isn't counted until it arrives.`
                : 'Set your pay schedule in Settings to measure this until your next paycheck.'}
            </li>
            <li>
              Day-to-day spending from your budget isn&apos;t subtracted. This is the pool it comes out of.
              {safe.cushion > 0 ? ` Your ${toCurrency(safe.cushion)} cushion is kept aside.` : ' You can keep a cushion aside in Settings.'}
            </li>
          </ul>
        </ExplainSection>
        <ReconcileRow label="Safe to spend" total={computed} expected={safe.amount} />
      </>
      break
    }

    case 'end':
    case 'flows': {
      const s = summarize(allEvents)
      const computed = data.startBalance + s.totalIn - s.totalOut
      title = kpi === 'end' ? `In ${days} days` : 'Coming in / going out'
      description = `Everything the forecast expects over the next ${days} days.`
      content = <>
        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
          <Term label="Today" value={data.startBalance} /> + <Term label="coming in" value={s.totalIn} tone="positive" />
          {' − '}<Term label="going out" value={s.totalOut} /> = <Term label={`in ${days} days`} value={computed} tone={computed < 0 ? 'negative' : undefined} />
        </div>
        <FlowLists summary={s} onExplainBudget={() => onExplain('budget')} />
        {kpi === 'end'
          ? <ReconcileRow label={`Balance in ${days} days`} total={computed} expected={forecast.end} />
          : <>
            <ReconcileRow label="Coming in" total={s.totalIn} expected={forecast.totalIn} />
            <ReconcileRow label="Going out" total={s.totalOut} expected={forecast.totalOut} />
          </>
        }
      </>
      break
    }

    case 'low': {
      const s = summarize(eventsToLow)
      const computed = data.startBalance + s.totalIn - s.totalOut
      title = 'Lowest point'
      description = `The lowest projected balance, on ${format(parseISO(forecast.low.date), 'EEE, MMM d')}, and what gets it there.`
      content = <>
        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
          <Term label="Today" value={data.startBalance} /> + <Term label="in" value={s.totalIn} tone="positive" />
          {' − '}<Term label="out" value={s.totalOut} /> by {format(parseISO(forecast.low.date), 'MMM d')}
          {' = '}<Term label="lowest" value={computed} tone={computed < 0 ? 'negative' : undefined} />
        </div>
        <FlowLists summary={s} onExplainBudget={() => onExplain('budget')} />
        <ReconcileRow label="Lowest balance" total={computed} expected={forecast.low.balance} />
      </>
      break
    }

    case 'budget': {
      const budgetEvents = everyEvent.filter(e => e.source === 'budget' && e.date <= windowEnd)
      const shown = budgetEvents.reduce((sum, e) => sum + e.amount, 0)
      title = 'Estimated spending'
      description = `What's left of your budget, spread over the next ${days} days. Shown as the dashed line; it never changes safe to spend.`
      content = <BudgetExplanation
        data={data}
        budgetEvents={budgetEvents}
        shown={shown}
        to={windowEnd}
        budgetOn={showEstimates}
      />
      break
    }
  }

  return (
    <ExplainSheet open={kpi !== null} onOpenChange={onOpenChange} title={title} description={description}>
      {content}
    </ExplainSheet>
  )
}

function FlowLists({ summary, onExplainBudget }: { summary: ReturnType<typeof summarize>, onExplainBudget: () => void }) {
  return <>
    {([['Coming in', summary.incoming, summary.totalIn, true], ['Going out', summary.outgoing, summary.totalOut, false]] as const)
      .map(([label, groups, total, incoming]) => (
        <ExplainSection
          key={label}
          title={`${label} · ${toCurrency(total)}`}
          description={groups.length === 0 ? 'Nothing expected.' : undefined}
        >
          {groups.map(g => (
            <details key={g.source} className="group rounded-lg border" open={g.source !== 'budget'}>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                <span className="flex-1 text-sm font-medium">{SOURCE_LABELS[g.source]}</span>
                <span className={`text-sm tabular-nums ${incoming ? 'text-positive' : ''}`}>
                  {incoming ? '+' : ''}{toCurrency(g.total)}
                </span>
              </summary>
              <ul className="divide-y divide-border/60 border-t px-3">
                {g.items.map(item => (
                  <li key={`${item.source}-${item.name}`} className="flex items-center gap-2.5 py-1.5">
                    <MerchantLogo src={item.logoUrl} name={item.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{item.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.source === 'budget'
                          ? `Spread over ${item.dates.length} day${item.dates.length === 1 ? '' : 's'}`
                          : item.dates.map(d => format(parseISO(d), 'MMM d')).join(', ')}
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm tabular-nums ${incoming ? 'text-positive' : ''}`}>
                      {incoming ? '+' : ''}{toCurrency(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
              {g.source === 'budget' &&
                <div className="border-t px-3 py-2">
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={onExplainBudget}>
                    See the math by category
                  </Button>
                </div>
              }
            </details>
          ))}
        </ExplainSection>
      ))}
  </>
}

interface BudgetExplanationProps {
  data: ForecastResponse
  budgetEvents: ForecastEvent[]
  // The budgeted spending total the page shows for this window.
  shown: number
  to: string // last day in the window, YYYY-MM-DD
  budgetOn: boolean
}

// Per month: budget − spent − recurring bills = left to spend, then how much
// of that lands inside this forecast window, by category.
function BudgetExplanation({ data, budgetEvents, shown, to, budgetOn }: BudgetExplanationProps) {
  if (!data.budgetPlan) {
    return <Notice>{data.budgetSkippedReason ?? 'Budgeted spending isn\'t forecast for this account.'}</Notice>
  }

  // What each category adds to this window, per month, from the same daily
  // events that draw the chart.
  const inWindow = new Map<string, number>()
  for (const e of budgetEvents) {
    for (const part of e.breakdown ?? []) {
      const key = `${e.date.slice(0, 7)}:${part.categoryName}`
      inWindow.set(key, (inWindow.get(key) ?? 0) + part.amount)
    }
  }

  const months = data.budgetPlan.filter(m => m.month <= to.slice(0, 7))
  const rowsTotal = Array.from(inWindow.values()).reduce((sum, v) => sum + v, 0)

  return <>
    {!budgetOn &&
      <Notice>Estimated spending is switched off, so the dashed line isn&apos;t shown. Turn it on beside the chart.</Notice>
    }

    {months.map(m => {
      const budget = sum(m.categories, c => c.budget)
      const spent = sum(m.categories, c => c.spent)
      const bills = sum(m.categories, c => c.billsTotal)
      const left = sum(m.categories, c => c.remaining)
      // Categories where spending and bills already exceed the budget count as
      // $0 left, not negative, so they add back here.
      const overBudget = Math.max(0, left - (budget - spent - bills))
      // Uncategorized spending already left the balance; it comes off what's left.
      const uncategorized = Math.min(m.uncategorizedSpent ?? 0, left)
      const leftAfter = Math.round((left - uncategorized) * 100) / 100
      const monthLabel = format(parseISO(`${m.month}-01`), 'MMMM yyyy')
      const monthInWindow = sum(m.categories, c => inWindow.get(`${m.month}:${c.categoryName}`) ?? 0)
      const daysInWindow = new Set(budgetEvents.filter(e => e.date.startsWith(m.month)).map(e => e.date)).size

      const withAmount = m.categories
        .map(c => ({ category: c, amount: inWindow.get(`${m.month}:${c.categoryName}`) ?? 0 }))
        .sort((a, b) => b.amount - a.amount || a.category.categoryName.localeCompare(b.category.categoryName))
      const counted = withAmount.filter(r => r.amount > 0)
      const nothingLeft = withAmount.filter(r => r.amount <= 0)

      return (
        <ExplainSection
          key={m.month}
          title={`${monthLabel} · ${toCurrency(monthInWindow)}`}
          description={m.assumedFrom
            ? `No ${monthLabel} budget yet, so ${format(parseISO(`${m.assumedFrom}-01`), 'MMMM')}'s is used with nothing spent.`
            : undefined}
        >
          <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm leading-relaxed tabular-nums">
            <Term label="Budget" value={budget} />
            {' − '}<Term label="spent" value={spent} />
            {' − '}<Term label="recurring bills" value={bills} />
            {overBudget > 0.005 && <>{' + '}<Term label="over-budget categories held at $0" value={overBudget} /></>}
            {uncategorized > 0.005 && <>{' − '}<Term label="uncategorized spending" value={uncategorized} /></>}
            {' = '}<Term label="left to spend" value={leftAfter} />
            {uncategorized > 0.005 &&
              <div className="mt-1 text-muted-foreground">
                {toCurrency(m.uncategorizedSpent)} was spent this month without a category. It&apos;s already out of your
                balance, so it&apos;s taken off what&apos;s left (in proportion) instead of being expected again.
              </div>
            }
            <div className="mt-1 text-muted-foreground">
              Spread over the {m.daysLeft} day{m.daysLeft === 1 ? '' : 's'} left in the month
              {daysInWindow < m.daysLeft
                ? `; ${daysInWindow} of them are in this forecast.`
                : ', all in this forecast.'}
            </div>
          </div>

          <ul className="divide-y divide-border/60 rounded-lg border px-3">
            {counted.map(({ category, amount }) => (
              <BudgetCategoryRow key={category.categoryName} category={category} amount={amount} />
            ))}
          </ul>

          {nothingLeft.length > 0 &&
            <details className="group rounded-lg border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <ChevronRightIcon className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                Nothing left to forecast ({nothingLeft.length})
              </summary>
              <ul className="divide-y divide-border/60 border-t px-3">
                {nothingLeft.map(({ category, amount }) => (
                  <BudgetCategoryRow key={category.categoryName} category={category} amount={amount} />
                ))}
              </ul>
            </details>
          }

          {m.excluded.length > 0 &&
            <p className="text-xs text-muted-foreground">
              Not included: {m.excluded.map(c => `${c.categoryName} (${c.type}, ${toCurrency(c.budget)})`).join(', ')}.
              Budgeted spending only covers expense categories.
            </p>
          }
        </ExplainSection>
      )
    })}

    <ReconcileRow label="Budgeted spending in this forecast" total={rowsTotal} expected={shown} />
    <p className="text-xs text-muted-foreground">
      Recurring bills taken out above are in the forecast on their own dates, under &ldquo;Recurring bills &amp;
      paychecks&rdquo;, so they aren&apos;t counted twice.
    </p>
  </>
}

function BudgetCategoryRow({ category, amount }: { category: BudgetPlanCategory, amount: number }) {
  const parts = [`${toCurrency(category.budget)} budget`]
  if (category.spent > 0) parts.push(`${toCurrency(category.spent)} spent`)
  if (category.billsTotal > 0) {
    parts.push(`${toCurrency(category.billsTotal)} in bills (${category.bills
      .map(b => `${b.name} ${format(parseISO(b.date), 'MMM d')}${b.late ? ', late' : ''}`)
      .join('; ')})`)
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{category.categoryName}</div>
        <div className="text-xs text-muted-foreground">{parts.join(' − ')}</div>
      </div>
      <span className={`shrink-0 text-sm tabular-nums ${amount > 0 ? '' : 'text-muted-foreground'}`}>
        {toCurrency(amount)}
      </span>
    </li>
  )
}

// Dated items with their amounts, e.g. the bills before payday.
function EventList({ title, events, empty, incoming }: { title: string, events: ForecastEvent[], empty?: string, incoming?: boolean }) {
  return (
    <ExplainSection title={title} description={events.length === 0 ? empty : undefined}>
      {events.length > 0 &&
        <ul className="divide-y divide-border/60 rounded-lg border px-3">
          {events.map((e, i) => (
            <li key={`${e.streamId ?? e.scheduledId ?? e.name}-${e.date}-${i}`} className="flex items-center gap-2.5 py-1.5">
              <MerchantLogo src={e.logoUrl} name={e.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{e.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {e.late
                    ? `Late: expected ${format(parseISO(e.expectedDate ?? e.date), 'MMM d')}, counted today`
                    : format(parseISO(e.date), 'EEE, MMM d')}
                  {e.categoryName && ` · ${e.categoryName}`}
                </div>
              </div>
              <span className={`shrink-0 text-sm tabular-nums ${incoming ? 'text-positive' : ''}`}>
                {incoming ? '+' : ''}{toCurrency(Math.abs(e.amount))}
              </span>
            </li>
          ))}
        </ul>
      }
    </ExplainSection>
  )
}

function Notice({ warning, children }: { warning?: boolean, children: React.ReactNode }) {
  const Icon = warning ? TriangleAlertIcon : InfoIcon
  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${warning ? 'border-warning/40 bg-warning/5' : ''}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${warning ? 'text-warning' : 'text-muted-foreground'}`} />
      <div>{children}</div>
    </div>
  )
}

const sum = <T,>(items: T[], value: (item: T) => number) =>
  Math.round(items.reduce((total, item) => total + value(item), 0) * 100) / 100
