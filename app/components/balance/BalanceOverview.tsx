'use client'

import { useEffect, useMemo, useState } from "react"
import { format, subDays, startOfYear, subYears } from "date-fns"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import useBalanceHistory from "@/app/hooks/useBalanceHistory"
import useCategories from "@/app/hooks/useCategories"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { CategoricalChartFunc } from "recharts/types/chart/types"

const LIABILITY_TYPES = new Set(["credit", "loan"])
const CATEGORY_PALETTE = ["var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function slugify(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_")
}

type RangePreset = "30d" | "90d" | "ytd" | "1y" | "all" | "custom"

const PRESET_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  "30d": "30D",
  "90d": "90D",
  ytd: "YTD",
  "1y": "1Y",
  all: "All",
}

function formatDateParam(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function resolveRange(preset: RangePreset, customStart?: Date, customEnd?: Date) {
  const today = new Date()

  switch (preset) {
    case "30d":
      return { start: formatDateParam(subDays(today, 30)), end: formatDateParam(today) }
    case "90d":
      return { start: formatDateParam(subDays(today, 90)), end: formatDateParam(today) }
    case "ytd":
      return { start: formatDateParam(startOfYear(today)), end: formatDateParam(today) }
    case "1y":
      return { start: formatDateParam(subYears(today, 1)), end: formatDateParam(today) }
    case "all":
      return { start: formatDateParam(subYears(today, 10)), end: formatDateParam(today) }
    case "custom":
      return {
        start: formatDateParam(customStart ?? subDays(today, 90)),
        end: formatDateParam(customEnd ?? today),
      }
  }
}

export default function BalanceOverview() {
  const [preset, setPreset] = useState<RangePreset>("90d")
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined)
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined)

  const { start, end } = useMemo(
    () => resolveRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  )

  const { data, isLoading, error } = useBalanceHistory(start, end)
  const { data: categories } = useCategories()

  const [includedAccountIds, setIncludedAccountIds] = useState<Set<string> | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [institutionFilter, setInstitutionFilter] = useState<string>("all")
  const [drillDownAccountId, setDrillDownAccountId] = useState<string>("all")
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const categoryNames = useMemo(() => {
    if (!categories) return []
    return Array.from(new Set(categories.map((c) => c.name).filter((name): name is string => !!name)))
      .sort((a, b) => a.localeCompare(b))
  }, [categories])

  useEffect(() => {
    if (data?.accounts && includedAccountIds === null) {
      setIncludedAccountIds(new Set(data.accounts.map((a) => a.account_id)))
    }
  }, [data, includedAccountIds])

  const institutions = useMemo(() => {
    if (!data) return []
    const seen = new Map<string, string>()
    data.accounts.forEach((a) => {
      if (a.institution_id) seen.set(a.institution_id, a.institutionName ?? a.institution_id)
    })
    return Array.from(seen, ([id, name]) => ({ id, name }))
  }, [data])

  const accountTypes = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.accounts.map((a) => a.type)))
  }, [data])

  const visibleAccounts = useMemo(() => {
    if (!data) return []
    return data.accounts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false
      if (institutionFilter !== "all" && a.institution_id !== institutionFilter) return false
      return true
    })
  }, [data, typeFilter, institutionFilter])

  const toggleAccount = (accountId: string) => {
    setIncludedAccountIds((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(accountId)) {
        next.delete(accountId)
      } else {
        next.add(accountId)
      }
      return next
    })
  }

  const toggleCategory = (categoryName: string) => {
    setSelectedCategoryNames((prev) => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  const overallSeries = useMemo(() => {
    if (!data) return []

    if (drillDownAccountId !== "all") {
      return data.balancesByAccount[drillDownAccountId] ?? []
    }

    const included = data.accounts.filter((a) => includedAccountIds?.has(a.account_id))

    return data.dates.map((_, i) =>
      included.reduce((sum, account) => {
        const value = data.balancesByAccount[account.account_id]?.[i] ?? 0
        const sign = LIABILITY_TYPES.has(account.type) ? -1 : 1
        return sum + sign * value
      }, 0)
    )
  }, [data, includedAccountIds, drillDownAccountId])

  const chartData = useMemo(() => {
    if (!data) return []

    return data.dates.map((date, i) => ({
      date,
      balance: overallSeries[i] ?? 0,
    }))
  }, [data, overallSeries])

  const drillDownAccountName = drillDownAccountId === "all"
    ? "Overall Balance"
    : data?.accounts.find((a) => a.account_id === drillDownAccountId)?.name ?? "Balance"

  const chartConfig = useMemo((): ChartConfig => ({
    balance: {
      label: drillDownAccountName,
      color: "var(--chart-1)",
    },
  }), [drillDownAccountName])

  // "How has spending in this category changed over time?" is best answered
  // by discrete monthly totals, not a cumulative running total — a cumulative
  // line only ever goes in one direction and obscures month-to-month swings.
  const months = useMemo(() => {
    if (!data) return []
    const seen = new Set<string>()
    const ordered: string[] = []
    data.dates.forEach((d) => {
      const month = d.slice(0, 7)
      if (!seen.has(month)) {
        seen.add(month)
        ordered.push(month)
      }
    })
    return ordered
  }, [data])

  const categorySpendChartData = useMemo(() => {
    if (!data) return []
    return months.map((month) => {
      const row: Record<string, number | string> = { month }
      selectedCategoryNames.forEach((name) => {
        const total = data.transactions
          .filter((t) => t.categoryName === name && t.date.slice(0, 7) === month)
          .reduce((sum, t) => sum + t.amount, 0)
        row[slugify(name)] = Math.round(total * 100) / 100
      })
      return row
    })
  }, [data, months, selectedCategoryNames])

  const categorySpendChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    Array.from(selectedCategoryNames).forEach((name, i) => {
      config[slugify(name)] = {
        label: name,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
      }
    })
    return config
  }, [selectedCategoryNames])

  const currentBalance = overallSeries[overallSeries.length - 1] ?? 0
  const startingBalance = overallSeries[0] ?? 0
  const delta = currentBalance - startingBalance

  const relevantAccountIds = useMemo(() => {
    if (drillDownAccountId !== "all") return new Set([drillDownAccountId])
    return includedAccountIds ?? new Set<string>()
  }, [drillDownAccountId, includedAccountIds])

  const selectedDateIndex = useMemo(
    () => (data && selectedDate ? data.dates.indexOf(selectedDate) : -1),
    [data, selectedDate]
  )

  const selectedDateDelta = selectedDateIndex > 0
    ? overallSeries[selectedDateIndex] - overallSeries[selectedDateIndex - 1]
    : null

  const transactionsForSelectedDate = useMemo(() => {
    if (!data || !selectedDate) return []
    return data.transactions.filter(
      (t) => t.date === selectedDate && relevantAccountIds.has(t.account_id)
    )
  }, [data, selectedDate, relevantAccountIds])

  const handleChartClick: CategoricalChartFunc = (state) => {
    if (typeof state?.activeLabel === "string") {
      setSelectedDate(state.activeLabel)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-destructive">
          Failed to load balance history. Make sure a Plaid item is linked.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Account Balance</h1>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(PRESET_LABELS) as (keyof typeof PRESET_LABELS)[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={preset === key ? "default" : "outline"}
            onClick={() => setPreset(key)}
          >
            {PRESET_LABELS[key]}
          </Button>
        ))}

        <div className="flex items-center gap-1">
          <DatePicker
            date={customStart}
            onDateChange={(date) => {
              setCustomStart(date)
              setPreset("custom")
            }}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <DatePicker
            date={customEnd}
            onDateChange={(date) => {
              setCustomEnd(date)
              setPreset("custom")
            }}
          />
        </div>

        <Select value={drillDownAccountId} onValueChange={setDrillDownAccountId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts (combined)</SelectItem>
            {data?.accounts.map((a) => (
              <SelectItem key={a.account_id} value={a.account_id}>
                {a.name}{a.mask ? ` ••${a.mask}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Accounts ({includedAccountIds?.size ?? 0}/{data?.accounts.length ?? 0})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>Filter list</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1 px-2 pb-2">
              <Badge
                variant={typeFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTypeFilter("all")}
              >
                All types
              </Badge>
              {accountTypes.map((type) => (
                <Badge
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
            {institutions.length > 1 && (
              <div className="flex flex-wrap gap-1 px-2 pb-2">
                <Badge
                  variant={institutionFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setInstitutionFilter("all")}
                >
                  All institutions
                </Badge>
                {institutions.map((inst) => (
                  <Badge
                    key={inst.id}
                    variant={institutionFilter === inst.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setInstitutionFilter(inst.id)}
                  >
                    {inst.name}
                  </Badge>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Include in total</DropdownMenuLabel>
            {visibleAccounts.map((a) => (
              <DropdownMenuCheckboxItem
                key={a.account_id}
                checked={includedAccountIds?.has(a.account_id) ?? false}
                onCheckedChange={() => toggleAccount(a.account_id)}
                onSelect={(e) => e.preventDefault()}
              >
                {a.name}{a.mask ? ` ••${a.mask}` : ""}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Categories ({selectedCategoryNames.size})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>Compare monthly spending by category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categoryNames.map((name) => (
              <DropdownMenuCheckboxItem
                key={name}
                checked={selectedCategoryNames.has(name)}
                onCheckedChange={() => toggleCategory(name)}
                onSelect={(e) => e.preventDefault()}
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{drillDownAccountName}: {toCurrency(currentBalance)}</CardTitle>
          <CardDescription>
            {delta >= 0 ? "+" : ""}{toCurrency(delta)} over selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <div className="h-96 animate-pulse rounded-md bg-muted" />
          ) : (
            <ChartContainer config={chartConfig} className="h-96 w-full [&_.recharts-surface]:cursor-pointer">
              <LineChart data={chartData} onClick={handleChartClick}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={90}
                  tickFormatter={(value) => toCurrency(value)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(new Date(value), "PPP")}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
          {!isLoading && data && (
            <p className="mt-2 text-xs text-muted-foreground">
              Click a point on the chart to see the transactions behind that day&apos;s change.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Spending by Month</CardTitle>
          <CardDescription>
            How spending in each selected category has changed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedCategoryNames.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pick one or more categories from the Categories menu above to compare their monthly spending.
            </p>
          ) : isLoading || !data ? (
            <div className="h-72 animate-pulse rounded-md bg-muted" />
          ) : (
            <ChartContainer config={categorySpendChartConfig} className="h-72 w-full">
              <BarChart data={categorySpendChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => format(new Date(`${value}-01`), "MMM yyyy")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={90}
                  tickFormatter={(value) => toCurrency(value)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(new Date(`${value}-01`), "MMMM yyyy")}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {Array.from(selectedCategoryNames).map((name) => (
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

      <div className="flex flex-wrap gap-2">
        {data?.accounts
          .filter((a) => includedAccountIds?.has(a.account_id))
          .map((a) => (
            <Badge key={a.account_id} variant="secondary">
              {a.name}: {toCurrency(a.currentBalance)}
            </Badge>
          ))}
      </div>

      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(new Date(selectedDate), "PPP") : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedDateDelta !== null ? (
                <>
                  Balance {selectedDateDelta >= 0 ? "increased" : "decreased"} by{" "}
                  <span className={selectedDateDelta >= 0 ? "text-[#00d062]" : "text-foreground"}>
                    {toCurrency(Math.abs(selectedDateDelta))}
                  </span>{" "}
                  this day.
                </>
              ) : (
                "No prior day in range to compare against."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {transactionsForSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions on this date for the account(s) shown.
              </p>
            ) : (
              transactionsForSelectedDate.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {t.merchant_name ?? t.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {t.categoryName && <Badge variant="outline">{t.categoryName}</Badge>}
                      {t.pending && <Badge variant="secondary">Pending</Badge>}
                    </div>
                  </div>
                  <div
                    className="shrink-0 text-sm font-medium"
                    style={{ color: t.amount < 0 ? "#00d062" : "inherit" }}
                  >
                    {toCurrency(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
