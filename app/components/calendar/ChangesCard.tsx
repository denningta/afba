'use client'

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CalendarClockIcon, CheckIcon, PlusIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChange } from "@/app/interfaces/forecast"
import { cn } from "@/lib/utils"

const SHOWN = 6

function ChangeIcon({ change }: { change: ForecastChange }) {
  const className = "mt-0.5 size-4 shrink-0"
  switch (change.kind) {
    case 'balance':
    case 'safeToSpend':
      return (change.amount ?? 0) >= 0
        ? <ArrowUpIcon className={cn(className, "text-positive")} />
        : <ArrowDownIcon className={cn(className, "text-negative")} />
    case 'paid': return <CheckIcon className={cn(className, "text-positive")} />
    case 'late': return <TriangleAlertIcon className={cn(className, "text-warning")} />
    case 'new': return <PlusIcon className={cn(className, "text-muted-foreground")} />
    case 'removed': return <XIcon className={cn(className, "text-muted-foreground")} />
    case 'moved': return <CalendarClockIcon className={cn(className, "text-muted-foreground")} />
    default: return <ArrowRightIcon className={cn(className, "text-muted-foreground")} />
  }
}

// Why today's numbers differ from the last day the forecast was opened.
export default function ChangesCard({ since, changes }: { since?: string | null, changes: ForecastChange[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!since || changes.length === 0) return null
  const shown = expanded ? changes : changes.slice(0, SHOWN)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Since {format(parseISO(since), 'EEEE, MMM d')}</CardTitle>
        <CardDescription>What changed since you last looked.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {shown.map((change, i) => (
            <li key={i} className="flex gap-2">
              <ChangeIcon change={change} />
              <span className="min-w-0">{change.text}</span>
            </li>
          ))}
        </ul>
        {changes.length > SHOWN &&
          <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Show fewer' : `Show all ${changes.length}`}
          </Button>
        }
      </CardContent>
    </Card>
  )
}
