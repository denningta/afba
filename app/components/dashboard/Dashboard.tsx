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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import PageHeader from "../common/PageHeader"
import { EmptyState, ErrorState } from "../common/StateMessage"
import BudgetKpiCards from "../budget/BudgetKpiCards"
import CategoryProgressRow from "../budget/CategoryProgressRow"
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
  const { data, isLoading, error } = useBalanceHistory(
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
          {isLoading ? <Skeleton className="h-8 w-36" /> : error ? '—' : toCurrency(current)}
        </CardTitle>
        <CardAction><ViewAll href="/balance" label="Balances" /></CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorState title="Couldn't load balances" error={error} className="py-6" />}
        {!isLoading && !error &&
          <div className="text-sm text-muted-foreground">
            <span className={cn("font-medium", change >= 0 ? "text-positive" : "text-negative")}>
              {change >= 0 ? '+' : '−'}{toCurrency(Math.abs(change))}
            </span>
            {' '}over the last {BALANCE_DAYS} days
          </div>
        }
        {error ? null : isLoading ? <Skeleton className="h-48 w-full" /> :
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
  const { data, isLoading, error, mutate } = useCategories({ date: month })

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
        {error && <ErrorState title="Couldn't load categories" error={error} onRetry={() => mutate()} className="py-6" />}
        {!isLoading && !error && top.length === 0 &&
          <EmptyState
            className="py-6"
            title="No spending yet this month"
            action={<Button variant="outline" asChild><Link href={`/budget/${month}`}>Plan this month</Link></Button>}
          />
        }
        {top.map(category => <CategoryProgressRow key={category.name} category={category} />)}
      </CardContent>
    </Card>
  )
}

function RecentTransactionsCard() {
  const { data, isLoading, error, mutate } = useTransactions()

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
        {error && <ErrorState title="Couldn't load transactions" error={error} onRetry={() => mutate()} className="py-6" />}
        {!isLoading && !error && recent.length === 0 &&
          <EmptyState
            className="py-6"
            title="No transactions yet"
            description="Link a bank account or import a CSV to get started."
            action={<Button variant="outline" asChild><Link href="/connect">Link an account</Link></Button>}
          />
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
  const { data, isLoading, error, mutate } = useCategories({ date: month })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={format(YYYYMMToDate(month), "MMMM yyyy")}
        actions={
          <Button asChild>
            <Link href={`/budget/${month}`}>Open budget</Link>
          </Button>
        }
      />
      {error
        ? <Card><ErrorState title="Couldn't load this month's budget" error={error} onRetry={() => mutate()} /></Card>
        : <BudgetKpiCards data={data} isLoading={isLoading} month={month} />
      }
      <div className="grid gap-4 lg:grid-cols-3">
        <NetBalanceCard />
        <TopCategoriesCard month={month} />
        <RecentTransactionsCard />
      </div>
    </div>
  )
}
