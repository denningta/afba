"use client"

import { dateToYYYYMM, formatShortDate, generateMonthDates, joinArraysOnDate, toCurrency } from "@/app/helpers/helperFunctions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "../common/PageHeader"
import { ErrorState } from "../common/StateMessage"
import useGetAccounts from "@/app/hooks/useGetAccounts"
import useGetUser from "@/app/hooks/useGetUser"
import useRecurringTransactions from "@/app/hooks/useRecurringTransactions"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { AccountBase, TransactionStream } from "plaid"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import AccountSelect from "./AccountSelect"
import { useEffect, useState } from "react"
import RecurringTransactionsTable from "./RecurringTransactionsTable"

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export type TransactionStreamBalance = TransactionStream & {
  balance?: number
  date?: string | null
}

const ForecastCalendar = () => {
  const userRes = useGetUser({ userId: 'root-user' })
  const { transactions, loading } = useRecurringTransactions({ access_token: userRes.user?.items[0].plaidAccessToken })
  const { items, error: accountsError, refresh } = useGetAccounts({ userId: 'root-user' })
  const [selectedAccount, setSelectedAccount] = useState<AccountBase | null>(null)

  useEffect(() => {
    if (!items) return
    setSelectedAccount(items[0]?.accounts[0] ?? [])
  }, [items])

  const testData: TransactionStreamBalance[] = [
    ...(transactions?.outflow_streams || []),
    ...(transactions?.inflow_streams || [])
  ].sort((a, b) => {

    if (!a.predicted_next_date && !b.predicted_next_date) return 0
    if (!a.predicted_next_date === undefined) return 1
    if (!b.predicted_next_date === undefined) return -1

    const dateA = new Date(a.predicted_next_date as string)
    const dateB = new Date(b.predicted_next_date as string)

    return dateA.getTime() - dateB.getTime()
  }).filter(el => el.account_id === selectedAccount?.account_id)

  testData.map(el => el.date = el.predicted_next_date)

  const chartData = joinArraysOnDate(generateMonthDates(dateToYYYYMM(new Date())), testData)

  let currentBalance = selectedAccount?.balances.current ?? 0

  chartData.forEach(el => {
    el.balance = currentBalance - (el?.average_amount?.amount ?? 0)
    currentBalance = el.balance
  })

  const handleAccountChange = (account_id: string) => {
    setSelectedAccount(items && items[0].accounts.filter(el => el.account_id === account_id)[0])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Forecast"
        description="Projected balance from recurring transactions."
        actions={items &&
          <AccountSelect
            value={selectedAccount?.account_id}
            accounts={items[0].accounts ?? []}
            onValueChange={handleAccountChange}
          />
        }
      />
      {accountsError &&
        <Card>
          <ErrorState title="Couldn't load accounts" error={accountsError} onRetry={refresh} />
        </Card>
      }
      <Card>
        <CardHeader>
          <CardTitle>Projected balance</CardTitle>
          <CardDescription>{selectedAccount?.name ?? 'Select an account'} · this month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                minTickGap={24}
                tickFormatter={(value) => formatShortDate(String(value))}
              />
              <YAxis
                dataKey="balance"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={80}
                tickFormatter={(value) => toCurrency(Number(value)).replace(/\.\d\d$/, '')}
              />
              <ChartTooltip
                content={<ChartTooltipContent
                  labelFormatter={(label) => formatShortDate(String(label))}
                  formatter={(value, name, item) => (
                    <div className="flex w-full flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-balance)" />
                        {chartConfig.balance.label}
                        <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                          {toCurrency(value as number)}
                        </span>
                      </div>
                      {item.payload.account_id &&
                        <div className="text-muted-foreground">
                          {item.payload.description} · {toCurrency(item.payload.average_amount?.amount)}
                        </div>
                      }
                    </div>
                  )}
                />}
              />
              <Line
                dataKey="balance"
                type="monotone"
                stroke="var(--color-balance)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <RecurringTransactionsTable data={testData} />

    </div>
  )

}




export default ForecastCalendar
