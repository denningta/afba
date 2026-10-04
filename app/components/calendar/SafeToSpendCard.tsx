'use client'

import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { SafeToSpend } from "@/app/interfaces/forecast"
import { cn } from "@/lib/utils"
import { ExplainTrigger } from "../common/ExplainSheet"

// The headline: what can be spent before the next payday, and per day.
export default function SafeToSpendCard({ safe, onExplain, className }: { safe: SafeToSpend, onExplain: () => void, className?: string }) {
  const short = safe.amount < 0
  const until = format(parseISO(safe.windowEnd), 'EEE, MMM d')
  const billsOut = safe.outflows.reduce((sum, e) => sum + e.amount, 0)

  return (
    <ExplainTrigger onClick={onExplain} className={className}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>{short ? 'Short before payday' : 'Safe to spend'}</CardDescription>
          <CardTitle className={cn("text-3xl font-semibold tracking-tight tabular-nums", short && "text-negative")}>
            {toCurrency(Math.abs(safe.amount))}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {safe.payday ? `through ${until}` : `through ${until} (no payday found)`}
            {!short && safe.days > 1 && <> · <span className="font-medium text-foreground tabular-nums">{toCurrency(safe.perDay)}</span>/day for {safe.days} days</>}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground">
          <span>Balance {toCurrency(safe.startBalance)}</span>
          <span>− {safe.outflows.length} bill{safe.outflows.length === 1 ? '' : 's'} {toCurrency(billsOut)}</span>
          {safe.cushion > 0 && <span>− cushion {toCurrency(safe.cushion)}</span>}
          {safe.payday &&
            <span>Next paycheck {format(parseISO(safe.payday), 'EEE, MMM d')}{safe.paydayName ? ` (${safe.paydayName})` : ''}</span>
          }
        </CardContent>
      </Card>
    </ExplainTrigger>
  )
}
