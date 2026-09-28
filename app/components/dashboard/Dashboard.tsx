'use client'

import Link from "next/link"
import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ArrowRight } from "lucide-react"
import useCategories from "@/app/hooks/useCategories"
import useTransactions from "@/app/hooks/useTransactions"
import useBalanceHistory from "@/app/hooks/useBalanceHistory"
import { dateToYYYYMM, formatShortDate, parseDisplayDate, toCurrency, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import PageHeader from "../common/PageHeader"
import BudgetKpiCards from "../budget/BudgetKpiCards"
import { Amount, MerchantLogo } from "../transactions/TransactionCells"

const LIABILITY_TYPES = new Set(["credit", "loan"])
const BALANCE_DAYS = 90

const balanceChartConfig = {
  balance: { label: "Net balance", color: "var(--chart-1)" },
} satisfies ChartConfig

function ViewAll({ href, label }: { href: string, label: string }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>{label} <ArrowRight /></Link>
    </Button>
  )
}

function NetBalanceCard() {
  const today = new Date()
  const { data, isLoading } = useBalanceHistory(
    format(subDays(today, BALANCE_DAYS), "yyyy-MM-dd"),
    format(today, "yyyy-MM-dd"),
  )

  // Assets minus liabilities across every account, per day.
  const series = useMemo(() => {
    if (!data) return []
    return data.dates.map((date, i) => ({
      date,
      balance: data.accounts.reduce((sum, account) => {
        const value = data.balancesByAccount[account.account_id]?.[i] ?? 0
        return sum + (LIABILITY_TYPES.has(account.type) ? -value : value)
      }, 0),
    }))
  }, [data])

  const current = series[series.length - 1]?.balance ?? 0
  const change = current - (series[0]?.balance ?? 0)

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>Net balance</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {isLoading ? <Skeleton className="h-8 w-36" /> : toCurrency(current)}
        </CardTitle>
        <CardAction><ViewAll href="/balance" label="Balances" /></CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLoading &&
          <div className="text-sm text-muted-foreground">
            <span className={cn("font-medium", change >= 0 ? "text-positive" : "text-negative")}>
              {change >= 0 ? '+' : '−'}{toCurrency(Math.abs(change))}
            </span>
            {' '}over the last {BALANCE_DAYS} days
          </div>
        }
        {isLoading ? <Skeleton className="h-48 w-full" /> :
          <ChartContainer config={balanceChartConfig} className="h-48 w-full">
            <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="net-balance-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label) => formatShortDate(String(label))}
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">{toCurrency(Number(value))}</span>
                    )}
                  />
                }
              />
              <Area
                dataKey="balance"
                type="monotone"
                stroke="var(--color-balance)"
                strokeWidth={2}
                fill="url(#net-balance-fill)"
              />
            </AreaChart>
          </ChartContainer>
        }
      </CardContent>
    </Card>
  )
}

function TopCategoriesCard({ month }: { month: string }) {
  const { data, isLoading } = useCategories({ date: month })

  const top = useMemo(() => (data ?? [])
    .filter(c => (c.type === undefined || c.type === 'deduction') && ((c.spent ?? 0) > 0 || (c.budget ?? 0) > 0))
    .sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0))
    .slice(0, 5), [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top categories</CardTitle>
        <CardDescription>Spending vs budget this month</CardDescription>
        <CardAction><ViewAll href={`/budget/${month}`} label="Budget" /></CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        {!isLoading && top.length === 0 &&
          <p className="text-sm text-muted-foreground">No spending recorded this month yet.</p>
        }
        {top.map(category => {
          const spent = category.spent ?? 0
          const budget = category.budget ?? 0
          const percent = budget > 0 ? Math.round((spent / budget) * 100) : 100
          return (
            <div key={category.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{category.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <span className="text-foreground">{toCurrency(spent)}</span> / {toCurrency(budget)}
                </span>
              </div>
              <Progress
                className="h-2"
                value={Math.min(percent, 100)}
                indicatorClassName={spent <= budget ? 'bg-positive' : 'bg-negative'}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function RecentTransactionsCard() {
  const { data, isLoading } = useTransactions()

  const recent = useMemo(() => [...(data ?? [])]
    .map(transaction => ({ transaction, time: parseDisplayDate(transaction.date)?.getTime() ?? 0 }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 8)
    .map(({ transaction }) => transaction), [data])

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardAction><ViewAll href="/transactions" label="All transactions" /></CardAction>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>}
        {!isLoading && recent.length === 0 &&
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        }
        <ul className="divide-y divide-border/60">
          {recent.map(transaction => {
            const merchant = transaction.merchant_name || transaction.name
            return (
              <li key={transaction.transaction_id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <MerchantLogo src={transaction.logo_url} name={merchant} />
                <div className="min-w-0 flex-1">
                  <div className={cn("truncate text-sm font-medium", transaction.pending && "text-muted-foreground")}>
                    {merchant}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatShortDate(transaction.date)}
                    {' · '}
                    {transaction.userCategory?.name ?? 'Uncategorized'}
                    {transaction.pending && ' · Pending'}
                  </div>
                </div>
                <Amount value={transaction.amount} className="text-sm" />
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const month = dateToYYYYMM(new Date())
  const { data, isLoading } = useCategories({ date: month })

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Dashboard"
        description={format(YYYYMMToDate(month), "MMMM yyyy")}
        actions={
          <Button asChild>
            <Link href={`/budget/${month}`}>Open budget</Link>
          </Button>
        }
      />
      <BudgetKpiCards data={data} isLoading={isLoading} />
      <div className="grid gap-4 lg:grid-cols-3">
        <NetBalanceCard />
        <TopCategoriesCard month={month} />
        <RecentTransactionsCard />
      </div>
    </div>
  )
}
