'use client'

import { format, parseISO } from "date-fns"
import { CheckCircle2Icon, ChevronRightIcon, EllipsisIcon, EyeIcon, EyeOffIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { ForecastEvent, ForecastStream, PaidOccurrence, ScheduledTransaction } from "@/app/interfaces/forecast"
import { cn } from "@/lib/utils"
import { Amount, MerchantLogo } from "../transactions/TransactionCells"
import { EmptyState } from "../common/StateMessage"

export interface BillsListProps {
  from: string
  // Committed events in the forecast window (no budget estimates).
  events: ForecastEvent[]
  // Last day of the safe-to-spend window and the payday after it.
  windowEnd: string
  payday: string | null
  paid: PaidOccurrence[]
  streams: ForecastStream[]
  scheduled: ScheduledTransaction[]
  onEditStream: (stream: ForecastStream) => void
  onToggleStreamHidden: (stream: ForecastStream, hidden: boolean) => void
  onResetStream: (stream: ForecastStream) => void
  onEditScheduled: (item: ScheduledTransaction) => void
  onDeleteScheduled: (item: ScheduledTransaction) => void
  // Paychecks are edited in forecast settings.
  onEditPaySchedules: () => void
}

// Known bills and paychecks, split at the next payday, plus what already
// posted this cycle.
export default function BillsList(props: BillsListProps) {
  const { from, events, windowEnd, payday, paid, streams, onToggleStreamHidden } = props
  const beforePayday = events.filter(e => e.date <= windowEnd)
  const later = events.filter(e => e.date > windowEnd)
  const hidden = streams.filter(s => s.hidden)
  const outTotal = (list: ForecastEvent[]) => list.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <Section
        title={payday ? `Before payday · ${format(parseISO(payday), 'EEE, MMM d')}` : 'Rest of the month'}
        summary={`${beforePayday.filter(e => e.amount > 0).length} bills · ${toCurrency(outTotal(beforePayday))}`}
      >
        {beforePayday.length === 0
          ? <p className="py-3 text-sm text-muted-foreground">Nothing due before {payday ? 'payday' : 'the end of the month'}.</p>
          : <ul className="divide-y divide-border/60">{beforePayday.map((e, i) => <BillRow key={rowKey(e, i)} event={e} {...props} />)}</ul>
        }
      </Section>

      <Section title="Later" summary={later.length ? `${toCurrency(outTotal(later))} going out` : undefined}>
        {later.length === 0
          ? <EmptyState className="py-6" title="Nothing else expected" description="Recurring bills and paychecks Plaid detects appear here, along with items you add." />
          : <ul className="divide-y divide-border/60">{later.map((e, i) => <BillRow key={rowKey(e, i)} event={e} {...props} />)}</ul>
        }
      </Section>

      {paid.length > 0 &&
        <details className="group rounded-lg border">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium">
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            <span className="flex-1">Paid recently ({paid.length})</span>
            <span className="text-xs font-normal text-muted-foreground">Already in your balance, not counted again</span>
          </summary>
          <ul className="divide-y divide-border/60 border-t px-3">
            {paid.map(p => (
              <li key={`${p.key}@${p.postedDate}`} className="flex items-center gap-3 py-2">
                <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{format(parseISO(p.postedDate), 'MMM d')}</span>
                <MerchantLogo src={p.logoUrl} name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.postedDate === p.expectedDate ? 'Posted on time' : `Expected ${format(parseISO(p.expectedDate), 'MMM d')}`}
                    {p.categoryName && ` · ${p.categoryName}`}
                  </div>
                </div>
                <CheckCircle2Icon className="size-4 shrink-0 text-positive" aria-label="Paid" />
                <Amount value={p.amount} className="text-sm font-normal text-muted-foreground" />
              </li>
            ))}
          </ul>
        </details>
      }

      {hidden.length > 0 &&
        <details className="group rounded-lg border">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium">
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            Hidden recurring items ({hidden.length})
          </summary>
          <ul className="divide-y divide-border/60 border-t">
            {hidden.map(stream => (
              <li key={stream.streamId} className="flex items-center gap-3 px-3 py-2">
                <MerchantLogo src={stream.logoUrl} name={stream.name} />
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{stream.name}</span>
                <Amount value={stream.amount} className="text-sm font-normal text-muted-foreground" />
                <Button variant="ghost" size="sm" onClick={() => onToggleStreamHidden(stream, false)}>
                  <EyeIcon />
                  Unhide
                </Button>
              </li>
            ))}
          </ul>
        </details>
      }
    </div>
  )
}

const rowKey = (e: ForecastEvent, i: number) => `${e.streamId ?? e.payScheduleId ?? e.scheduledId ?? e.name}-${e.date}-${i}`

function Section({ title, summary, children }: { title: string, summary?: string, children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between gap-3 border-b pb-1.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {summary && <span className="text-xs tabular-nums text-muted-foreground">{summary}</span>}
      </div>
      {children}
    </section>
  )
}

function BillRow({ event, from, streams, scheduled, onEditStream, onToggleStreamHidden, onResetStream, onEditScheduled, onDeleteScheduled, onEditPaySchedules }: {
  event: ForecastEvent
  from: string
} & BillsListProps) {
  const stream = event.streamId ? streams.find(s => s.streamId === event.streamId) : undefined
  const scheduledItem = event.scheduledId ? scheduled.find(s => String(s._id) === event.scheduledId) : undefined
  const dueToday = event.date === from && !event.late
  const frequency = stream?.frequency ?? scheduledItem?.frequency

  return (
    <li className="flex items-center gap-3 py-2">
      <span className={cn("w-16 shrink-0 text-xs tabular-nums text-muted-foreground", (event.late || dueToday) && "font-medium text-foreground")}>
        {event.late || dueToday ? 'Today' : format(parseISO(event.date), 'EEE d')}
      </span>
      <MerchantLogo src={event.logoUrl} name={event.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium" title={event.name}>{event.name}</span>
          {event.paycheck && <Badge variant="secondary" className="shrink-0 font-normal">Payday</Badge>}
          {event.source === 'scheduled' && <Badge variant="secondary" className="shrink-0 font-normal">Scheduled</Badge>}
          {stream?.overridden && <Badge variant="secondary" className="shrink-0 font-normal">Edited</Badge>}
          {event.late &&
            <Badge variant="outline" className="shrink-0 border-warning/50 bg-warning/10 font-normal" title="Past its usual date and not posted yet; counted today">
              Late · expected {format(parseISO(event.expectedDate ?? event.date), 'MMM d')}
            </Badge>
          }
          {dueToday &&
            <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground" title="If it's already pending at your bank, it may also be in today's balance">
              Due today
            </Badge>
          }
          {event.confidence === 'low' && event.source === 'recurring' &&
            <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground" title="Plaid has only seen this a few times">Early estimate</Badge>
          }
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {event.categoryName ?? (event.source === 'scheduled' ? 'Added by you' : event.source === 'paycheck' ? 'Your pay schedule' : 'Recurring')}
          {frequency && frequency !== 'UNKNOWN' && frequency !== 'once' && ` · ${frequencyLabel(frequency)}`}
          {stream && stream.amountMode === 'average' && new Set(stream.recentAmounts).size > 1 && ` · avg of last ${stream.recentAmounts.length}`}
        </div>
      </div>
      <Amount value={event.amount} className="text-sm" />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`Actions for ${event.name}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {stream && <>
            <DropdownMenuItem onSelect={() => onEditStream(stream)}><PencilIcon /> Edit amount or date</DropdownMenuItem>
            {stream.overridden &&
              <DropdownMenuItem onSelect={() => onResetStream(stream)}><RotateCcwIcon /> Reset to Plaid&apos;s values</DropdownMenuItem>
            }
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onToggleStreamHidden(stream, true)}><EyeOffIcon /> Hide from forecast</DropdownMenuItem>
          </>}
          {scheduledItem && <>
            <DropdownMenuItem onSelect={() => onEditScheduled(scheduledItem)}><PencilIcon /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDeleteScheduled(scheduledItem)}><Trash2Icon /> Delete</DropdownMenuItem>
          </>}
          {event.source === 'paycheck' &&
            <DropdownMenuItem onSelect={onEditPaySchedules}><PencilIcon /> Edit pay schedule</DropdownMenuItem>
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function frequencyLabel(frequency: string) {
  switch (frequency) {
    case 'WEEKLY': return 'Weekly'
    case 'BIWEEKLY': return 'Every 2 weeks'
    case 'SEMI_MONTHLY': return 'Twice a month'
    case 'MONTHLY': return 'Monthly'
    case 'ANNUALLY': return 'Yearly'
    default: return 'Once'
  }
}
