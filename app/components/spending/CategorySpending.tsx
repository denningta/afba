'use client'

import { useCallback, useMemo, useSyncExternalStore } from "react"
import { format, parseISO } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import useCategorySpending from "@/app/hooks/useCategorySpending"
import { dateToYYYYMM, toCurrency } from "@/app/helpers/helperFunctions"
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "../common/StateMessage"
import CategoryPicker from "./CategoryPicker"
import { categoryInsights } from "./categoryInsights"

const CATEGORY_PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function slugify(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_")
}

const RANGE_OPTIONS = [6, 12, 24] as const
type RangeMonths = typeof RANGE_OPTIONS[number]

// Remembered per browser. `selected` is absent until the viewer picks
// categories, so the page starts on the biggest ones instead of an empty chart.
const STORAGE_KEY = "afba:category-spending"
const CHANGE_EVENT = "afba:category-spending-change"
const DEFAULT_MONTHS: RangeMonths = 12
const DEFAULT_SELECTION_SIZE = 3

interface SavedSpendingFilters {
  selected?: string[]
  months?: RangeMonths
}

// The raw string is the snapshot, so it compares equal until storage changes.
const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function useSavedFilters() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  const saved = useMemo((): SavedSpendingFilters => {
    try {
      return JSON.parse(raw ?? "{}") ?? {}
    } catch {
      return {}
    }
  }, [raw])

  const save = useCallback((next: SavedSpendingFilters) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked: choices just won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return [saved, save] as const
}

export default function CategorySpending() {
  const [saved, save] = useSavedFilters()
  const months = saved.months && RANGE_OPTIONS.includes(saved.months) ? saved.months : DEFAULT_MONTHS
  const end = useMemo(() => dateToYYYYMM(new Date()), [])

  const { data, error, isLoading, mutate } = useCategorySpending(end, months)

  // Until the viewer picks, show the biggest expense categories over the window.
  const selected = useMemo(() => {
    if (saved.selected) return new Set(saved.selected)
    const top = (data?.categories ?? [])
      .filter((c) => c.type !== "income")
      .map((c) => ({ name: c.name, total: c.totals.reduce((sum, v) => sum + v, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, DEFAULT_SELECTION_SIZE)
      .map((c) => c.name)
    return new Set(top)
  }, [saved.selected, data])

  const setMonths = (next: RangeMonths) => save({ ...saved, months: next })

  const setSelected = (names: string[]) => save({ ...saved, selected: names })

  const toggleCategory = (name: string) => {
    const next = new Set(selected)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    save({ ...saved, selected: Array.from(next) })
  }

  const chartData = useMemo(() => {
    if (!data) return []
    const byName = new Map(data.categories.map((c) => [c.name, c]))
    return data.months.map((month, i) => {
      const row: Record<string, number | string> = { month }
      selected.forEach((name) => {
        row[slugify(name)] = byName.get(name)?.totals[i] ?? 0
      })
      return row
    })
  }, [data, selected])

  // One color per selected category, shared by the chart and the picker.
  const colorByName = useMemo(
    () => new Map(Array.from(selected).map((name, i) => [name, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]])),
    [selected]
  )

  const insights = useMemo(() => data ? categoryInsights(data, end) : [], [data, end])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    Array.from(selected).forEach((name, i) => {
      config[slugify(name)] = {
        label: name,
        color: colorByName.get(name) ?? CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
      }
    })
    return config
  }, [selected, colorByName])

  if (error) {
    return (
      <Card>
        <ErrorState title="Couldn't load category spending" error={error} onRetry={() => mutate()} />
      </Card>
    )
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Category spending by month</CardTitle>
          <CardDescription>
            How spending in each selected category has changed over time
          </CardDescription>
          <CardAction>
            <Tabs value={String(months)} onValueChange={(value) => setMonths(Number(value) as RangeMonths)}>
              <TabsList aria-label="Months to show">
                {RANGE_OPTIONS.map((option) => (
                  <TabsTrigger key={option} value={String(option)} className="px-3">
                    {option}M
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-80 w-full" />
          ) : selected.size === 0 ? (
            <EmptyState
              title="No categories selected"
              description="Pick categories in the Categories card, or try a quick pick like Top 3 over budget."
            />
          ) : (
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => format(parseISO(`${value}-01`), "MMM yyyy")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tickFormatter={(value) => toCurrency(value).replace(/\.\d\d$/, "")}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(parseISO(`${value}-01`), "MMMM yyyy")}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {Array.from(selected).map((name) => (
                  <Bar
                    key={name}
                    dataKey={slugify(name)}
                    fill={`var(--color-${slugify(name)})`}
                    radius={4}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      {isLoading || !data
        ? <Skeleton className="h-[480px] w-full" />
        : <CategoryPicker
          insights={insights}
          selected={selected}
          colorFor={(name) => colorByName.get(name)}
          onToggle={toggleCategory}
          onSelect={setSelected}
          monthsLabel={`${months} months`}
          className="lg:sticky lg:top-20"
        />
      }
    </div>
  )
}
