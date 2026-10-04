'use client'

import { useMemo, useState } from "react"
import { ArrowDownRightIcon, ArrowUpRightIcon, SearchIcon, SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { cn } from "@/lib/utils"
import { CategoryInsight, InsightSort, SELECTION_PRESETS, SORT_LABELS, sortInsights } from "./categoryInsights"

// Thresholds for the badges that flag a category as worth a look.
const TREND_BADGE_PCT = 15
const SPIKY_VARIABILITY = 0.5

export interface CategoryPickerProps {
  insights: CategoryInsight[]
  selected: Set<string>
  // The chart color of a selected category.
  colorFor: (name: string) => string | undefined
  onToggle: (name: string) => void
  onSelect: (names: string[]) => void
  monthsLabel: string // e.g. "12 months"
  className?: string
}

// Which categories to chart, with enough about each (size, trend, budget
// misses, spikiness) to tell which ones are interesting, plus presets.
export default function CategoryPicker({ insights, selected, colorFor, onToggle, onSelect, monthsLabel, className }: CategoryPickerProps) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [sort, setSort] = useState<InsightSort>('total')
  const [search, setSearch] = useState('')

  const presets = useMemo(() => SELECTION_PRESETS.map(preset => {
    const names = preset.pick(insights)
    const active = names.length > 0 && names.length === selected.size && names.every(n => selected.has(n))
    return { ...preset, names, active }
  }), [insights, selected])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sortInsights(
      insights.filter(i => (kind === 'income') === i.income && (!query || i.name.toLowerCase().includes(query))),
      sort,
    )
  }, [insights, kind, sort, search])

  return (
    <Card className={cn("min-h-0", className)}>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>{selected.size} selected · numbers cover the last {monthsLabel}</CardDescription>
        {selected.size > 0 &&
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => onSelect([])}>Clear</Button>
          </CardAction>
        }
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SparklesIcon className="size-3.5" /> Quick picks
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(preset => (
              <Tooltip key={preset.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={preset.active ? 'default' : 'outline'}
                    aria-pressed={preset.active}
                    disabled={preset.names.length === 0}
                    className="h-7 rounded-full px-3 text-xs font-normal"
                    onClick={() => onSelect(preset.names)}
                  >
                    {preset.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {preset.names.length ? `${preset.description}: ${preset.names.join(', ')}` : `${preset.description}: none right now`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={kind} onValueChange={v => setKind(v as 'expense' | 'income')}>
            <TabsList>
              <TabsTrigger value="expense" className="px-3">Expenses</TabsTrigger>
              <TabsTrigger value="income" className="px-3">Income</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={sort} onValueChange={v => setSort(v as InsightSort)}>
            <SelectTrigger size="sm" className="w-[150px]" aria-label="Sort categories"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as InsightSort[])
                .filter(key => kind === 'expense' || key !== 'overBudget')
                .map(key => <SelectItem key={key} value={key}>{SORT_LABELS[key]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…" aria-label="Search categories" className="h-8 pl-8" />
        </div>

        <ul className="-mx-2 min-h-0 flex-1 max-h-[520px] overflow-y-auto">
          {rows.length === 0 &&
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">No categories match.</li>
          }
          {rows.map(insight => (
            <CategoryRow
              key={insight.name}
              insight={insight}
              checked={selected.has(insight.name)}
              color={colorFor(insight.name)}
              onToggle={() => onToggle(insight.name)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function CategoryRow({ insight, checked, color, onToggle }: {
  insight: CategoryInsight
  checked: boolean
  color?: string
  onToggle: () => void
}) {
  const id = `category-${insight.name.replace(/[^a-zA-Z0-9]+/g, '-')}`
  const trendUp = (insight.trendPct ?? 0) >= TREND_BADGE_PCT
  const trendDown = (insight.trendPct ?? 0) <= -TREND_BADGE_PCT
  // Rising spending is bad news; rising income is good.
  const trendBad = insight.income ? trendDown : trendUp

  return (
    <li>
      <label
        htmlFor={id}
        className={cn("flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60", checked && "bg-muted/40")}
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onToggle}
          style={checked && color ? { backgroundColor: color, borderColor: color } : undefined}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{insight.name}</span>
            <span className="shrink-0 text-sm tabular-nums">{toCurrency(insight.total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkline values={insight.totals} color={checked ? color : undefined} />
            <span className="text-xs tabular-nums text-muted-foreground">{toCurrency(insight.average).replace(/\.\d\d$/, '')}/mo</span>
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              {(trendUp || trendDown) &&
                <InsightBadge
                  tone={trendBad ? 'bad' : 'good'}
                  hint={`Last 3 months averaged ${Math.abs(insight.trendPct!)}% ${trendUp ? 'more' : 'less'} than the 3 before`}
                >
                  {trendUp ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}{Math.abs(insight.trendPct!)}%
                </InsightBadge>
              }
              {insight.overMonths > 0 &&
                <InsightBadge
                  tone="bad"
                  hint={`Over budget in ${insight.overMonths} of ${insight.budgetedMonths} budgeted months, by ${toCurrency(insight.overBudget)} in total`}
                >
                  Over {insight.overMonths}/{insight.budgetedMonths}
                </InsightBadge>
              }
              {(insight.variability ?? 0) >= SPIKY_VARIABILITY &&
                <InsightBadge hint="Changes a lot from month to month">Spiky</InsightBadge>
              }
            </div>
          </div>
        </div>
      </label>
    </li>
  )
}

function InsightBadge({ tone, hint, children }: { tone?: 'good' | 'bad', hint: string, children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "h-5 gap-0.5 px-1.5 text-[11px] font-normal [&>svg]:size-3",
            tone === 'bad' && "border-negative/40 text-negative",
            tone === 'good' && "border-positive/40 text-positive",
            !tone && "text-muted-foreground",
          )}
        >
          {children}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

// Tiny bar chart of monthly actuals, oldest first.
function Sparkline({ values, color }: { values: number[], color?: string }) {
  const width = 64
  const height = 18
  const max = Math.max(...values.map(v => Math.max(v, 0)), 1)
  const barWidth = width / values.length
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden>
      {values.map((v, i) => {
        const h = Math.max(1, (Math.max(v, 0) / max) * height)
        return (
          <rect
            key={i}
            x={i * barWidth + 0.5}
            y={height - h}
            width={Math.max(1, barWidth - 1)}
            height={h}
            rx={0.5}
            fill={color ?? 'var(--muted-foreground)'}
            opacity={color ? 0.9 : 0.4}
          />
        )
      })}
    </svg>
  )
}
