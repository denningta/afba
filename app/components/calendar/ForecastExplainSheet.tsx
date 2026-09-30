'use client'

import { format, parseISO } from "date-fns"
import { ChevronRightIcon } from "lucide-react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { ForecastEvent, ForecastResponse, ForecastSource } from "@/app/interfaces/forecast"
import { Forecast } from "@/app/lib/forecast"
import ExplainSheet, { ExplainSection, ReconcileRow, Term } from "../common/ExplainSheet"
import { MerchantLogo } from "../transactions/TransactionCells"

export type ForecastKpiKey = 'today' | 'end' | 'low' | 'flows'

const SOURCE_LABELS: Record<ForecastSource, string> = {
  recurring: 'Recurring bills & paychecks',
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
  forecast: Forecast
  days: number
  lateCount: number
}

// The math behind the Forecast's summary cards, itemized from the same
// events that draw the chart.
export default function ForecastExplainSheet({ kpi, onOpenChange, data, forecast, days, lateCount }: ForecastExplainSheetProps) {
  const allEvents = forecast.points.flatMap(p => p.events)
  const lowIndex = forecast.points.findIndex(p => p.date === forecast.low.date)
  const eventsToLow = forecast.points.slice(0, lowIndex + 1).flatMap(p => p.events)

  let title = ''
  let description: React.ReactNode = ''
  let content: React.ReactNode = null

  switch (kpi) {
    case 'today':
      title = 'Today'
      description = 'Where the starting balance comes from.'
      content = <>
        <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm tabular-nums">
          <Term label={data.balanceSource === 'available' ? 'Available balance' : 'Current balance'} value={data.startBalance} />
          {' '}for {data.account.name}{data.account.mask ? ` ••${data.account.mask}` : ''}
        </div>
        <ExplainSection title="How it's measured">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              This is the balance your bank last reported to Plaid
              {data.balanceAsOf ? ` (${format(new Date(data.balanceAsOf), 'MMM d, h:mm a')})` : ''}. Plaid refreshes it a few times a day.
            </li>
            <li>
              The {data.balanceSource} balance is used so charges already in flight are counted. Some banks include
              pending transactions in it without sharing them, so it can differ from your bank app&apos;s posted balance.
            </li>
            {lateCount > 0 &&
              <li>
                {lateCount} late recurring item{lateCount === 1 ? ' is' : 's are'} not added on top, since
                {lateCount === 1 ? ' it is' : ' they are'} likely already pending in this balance.
              </li>
            }
          </ul>
        </ExplainSection>
      </>
      break

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
        <FlowLists summary={s} />
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
        <FlowLists summary={s} />
        <ReconcileRow label="Lowest balance" total={computed} expected={forecast.low.balance} />
      </>
      break
    }
  }

  return (
    <ExplainSheet open={kpi !== null} onOpenChange={onOpenChange} title={title} description={description}>
      {content}
    </ExplainSheet>
  )
}

function FlowLists({ summary }: { summary: ReturnType<typeof summarize> }) {
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
            </details>
          ))}
        </ExplainSection>
      ))}
  </>
}
