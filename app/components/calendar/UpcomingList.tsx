'use client'

import { format, parseISO } from "date-fns"
import { EllipsisIcon, EyeIcon, EyeOffIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { ForecastEvent, ForecastStream, ScheduledTransaction } from "@/app/interfaces/forecast"
import { ForecastPoint } from "@/app/lib/forecast"
import { cn } from "@/lib/utils"
import { Amount, MerchantLogo } from "../transactions/TransactionCells"
import { EmptyState } from "../common/StateMessage"

export interface UpcomingListProps {
  points: ForecastPoint[]
  // Recurring items past their usual date and not seen yet.
  lateEvents: ForecastEvent[]
  countLate: boolean
  onCountLateChange: (count: boolean) => void
  streams: ForecastStream[]
  scheduled: ScheduledTransaction[]
  onEditStream: (stream: ForecastStream) => void
  onToggleStreamHidden: (stream: ForecastStream, hidden: boolean) => void
  onResetStream: (stream: ForecastStream) => void
  onEditScheduled: (item: ScheduledTransaction) => void
  onDeleteScheduled: (item: ScheduledTransaction) => void
}

// Expected transactions grouped by day, with the projected balance after each
// day. Budgeted spending is spread across every day, so it's summarized once
// at the top instead of repeated on each row.
export default function UpcomingList({
  points,
  lateEvents,
  countLate,
  onCountLateChange,
  streams,
  scheduled,
  onEditStream,
  onToggleStreamHidden,
  onResetStream,
  onEditScheduled,
  onDeleteScheduled,
}: UpcomingListProps) {
  const streamById = new Map(streams.map(s => [s.streamId, s]))
  const scheduledById = new Map(scheduled.map(s => [String(s._id), s]))
  const budgetTotal = points.reduce(
    (sum, p) => sum + p.events.filter(e => e.source === 'budget').reduce((s, e) => s + e.amount, 0), 0)
  const days = points
    .map(p => ({ ...p, items: p.events.filter(e => e.source !== 'budget') }))
    .filter(p => p.items.length > 0)
  const hidden = streams.filter(s => s.hidden)

  return (
    <div className="space-y-4">
      {lateEvents.length > 0 &&
        <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium">
                {lateEvents.length} late item{lateEvents.length === 1 ? '' : 's'} {countLate ? 'counted today' : 'not counted'}
              </div>
              <div className="text-xs text-muted-foreground">
                Past the usual date and not seen yet. If it&apos;s already pending at your bank, it&apos;s probably
                in today&apos;s balance, so it isn&apos;t counted again unless you choose to.
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onCountLateChange(!countLate)}>
              {countLate ? "Don't count" : 'Count in forecast'}
            </Button>
          </div>
          <ul className="divide-y divide-border/60">
            {lateEvents.map((event, i) => {
              const stream = event.streamId ? streamById.get(event.streamId) : undefined
              return (
                <li key={`${event.streamId ?? event.name}-${i}`} className="flex items-center gap-3 py-2">
                  <MerchantLogo src={event.logoUrl} name={event.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{event.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {stream ? `Usually ${format(parseISO(stream.nextDate), 'MMM d')}` : 'Late'}
                      {event.categoryName && ` · ${event.categoryName}`}
                    </div>
                  </div>
                  <Amount value={event.amount} className="text-sm" />
                </li>
              )
            })}
          </ul>
        </div>
      }

      {budgetTotal > 0 &&
        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          Also includes <span className="font-medium text-foreground tabular-nums">{toCurrency(budgetTotal)}</span> of
          budgeted spending, spread evenly across these days.
        </p>
      }

      {days.length === 0 &&
        <EmptyState
          className="py-6"
          title="Nothing scheduled in this period"
          description="Recurring bills and paychecks Plaid detects appear here, along with items you add."
        />
      }

      <ol className="space-y-5">
        {days.map(day => (
          <li key={day.date}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 border-b pb-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{format(parseISO(day.date), 'EEE, MMM d')}</span>
              <span className="tabular-nums">
                Balance after: <span className={cn("font-medium", day.balance < 0 ? "text-negative" : "text-foreground")}>{toCurrency(day.balance)}</span>
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {day.items.map((event, i) => (
                <EventRow
                  key={`${event.streamId ?? event.scheduledId ?? event.name}-${i}`}
                  event={event}
                  stream={event.streamId ? streamById.get(event.streamId) : undefined}
                  scheduledItem={event.scheduledId ? scheduledById.get(event.scheduledId) : undefined}
                  onEditStream={onEditStream}
                  onToggleStreamHidden={onToggleStreamHidden}
                  onResetStream={onResetStream}
                  onEditScheduled={onEditScheduled}
                  onDeleteScheduled={onDeleteScheduled}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {hidden.length > 0 &&
        <details className="rounded-lg border">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
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

function EventRow({ event, stream, scheduledItem, onEditStream, onToggleStreamHidden, onResetStream, onEditScheduled, onDeleteScheduled }: {
  event: ForecastEvent
  stream?: ForecastStream
  scheduledItem?: ScheduledTransaction
} & Pick<UpcomingListProps, 'onEditStream' | 'onToggleStreamHidden' | 'onResetStream' | 'onEditScheduled' | 'onDeleteScheduled'>) {
  return (
    <li className="flex items-center gap-3 py-2">
      <MerchantLogo src={event.logoUrl} name={event.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium" title={event.name}>{event.name}</span>
          {event.source === 'scheduled' && <Badge variant="secondary" className="shrink-0 font-normal">Scheduled</Badge>}
          {stream?.overridden && <Badge variant="secondary" className="shrink-0 font-normal">Edited</Badge>}
          {event.late &&
            <Badge
              variant="outline"
              className="shrink-0 border-warning/50 bg-warning/10 font-normal"
              title="Past its usual date and not seen yet - it may be pending at your bank"
            >
              Late · expected any day
            </Badge>
          }
          {event.confidence === 'low' && event.source === 'recurring' &&
            <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground" title="Plaid has only seen this a few times">Early estimate</Badge>
          }
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {event.categoryName ?? (event.source === 'scheduled' ? 'Added by you' : 'Recurring')}
          {stream && stream.frequency !== 'UNKNOWN' && ` · ${frequencyLabel(stream.frequency)}`}
          {scheduledItem && scheduledItem.frequency !== 'once' && ` · ${frequencyLabel(scheduledItem.frequency)}`}
        </div>
      </div>
      <Amount value={event.amount} className="text-sm" />

      {(stream || scheduledItem) &&
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
          </DropdownMenuContent>
        </DropdownMenu>
      }
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
