'use client'

import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { cn } from "@/lib/utils"

export interface ExplainSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  // The formula, in words and numbers, e.g. "Budgeted − Spent = Left".
  math?: React.ReactNode
  children: React.ReactNode
}

// "Where does this number come from?" - a side sheet (bottom sheet on phones)
// that shows a number's formula and the rows that add up to it.
export default function ExplainSheet({ open, onOpenChange, title, description, math, children }: ExplainSheetProps) {
  const isMobile = useIsMobile()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className="max-h-[85dvh] gap-0 overflow-y-auto data-[side=right]:max-h-none data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="space-y-6 p-4">
          {math &&
            <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm leading-relaxed tabular-nums">{math}</div>
          }
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ExplainSection({ title, description, action, children }: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// A total row with a reconciliation check: does the sum of the rows above
// equal the number on the card? A mismatch means our own math is off.
export function ReconcileRow({ label = 'Total', total, expected }: { label?: string, total: number, expected: number }) {
  const matches = Math.abs(total - expected) < 0.01

  return (
    <div className="flex items-center justify-between gap-3 border-t pt-2 text-sm">
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center gap-1 text-xs",
          matches ? "text-positive" : "text-negative",
        )}>
          {matches ? <CheckCircle2Icon className="size-3.5" /> : <TriangleAlertIcon className="size-3.5" />}
          {matches ? 'Matches card' : `Card shows ${toCurrency(expected)}`}
        </span>
        <span className="font-semibold tabular-nums">{toCurrency(total)}</span>
      </span>
    </div>
  )
}

// A highlighted value inside a math line.
export function Term({ label, value, tone }: { label: string, value: number, tone?: 'positive' | 'negative' }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">{label} </span>
      <span className={cn("font-semibold", tone === 'positive' && "text-positive", tone === 'negative' && "text-negative")}>
        {toCurrency(value)}
      </span>
    </span>
  )
}

// Makes a KPI card a button that opens its explanation, with a small info
// icon hinting that the number can be inspected.
export function ExplainTrigger({ onClick, children, className }: {
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        "group/explain relative block w-full rounded-xl text-left transition-shadow",
        "hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
      <InfoIcon
        aria-hidden
        className="absolute top-3 right-3 size-4 text-muted-foreground/60 transition-colors group-hover/explain:text-primary"
      />
      <span className="sr-only">Show how this number is calculated</span>
    </button>
  )
}
