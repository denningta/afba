"use client"

import { generateMonthDates, joinArraysOnDate, toCurrency } from "@/app/helpers/helperFunctions"
import useGetAccounts from "@/app/hooks/useGetAccounts"
import useGetUser from "@/app/hooks/useGetUser"
import useRecurringTransactions from "@/app/hooks/useRecurringTransactions"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { AccountBase, TransactionStream } from "plaid"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import AccountSelect from "./AccountSelect"
import { useEffect, useState } from "react"
import { DataTable } from "../common/DataTable"
import RecurringTransactionsTable from "./RecurringTransactionsTable"

const chartConfig = {
  balance: {
    label: "Balance",
    color: "#2563eb",
  },
} satisfies ChartConfig

export type TransactionStreamBalance = TransactionStream & {
  balance?: number
  date?: string | null
}

const ForecastCalendar = () => {
  const userRes = useGetUser({ userId: 'root-user' })
  const { transactions, loading } = useRecurringTransactions({ access_token: userRes.user?.items[0].plaidAccessToken })
  const { items } = useGetAccounts({ userId: 'root-user' })
  const [selectedAccount, setSelectedAccount] = useState<AccountBase | null>(null)
  console.log(selectedAccount)

  useEffect(() => {
    if (!items) return
    setSelectedAccount(items[0].accounts[0])
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

  const chartData = joinArraysOnDate(generateMonthDates('2025-08'), testData)

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
      <div className="flex max-w-[200px]">
        {items &&
          <AccountSelect
            value={selectedAccount?.account_id}
            accounts={items[0].accounts}
            onValueChange={handleAccountChange}
          />
        }
      </div>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full max-w-[1200px] mx-6">
        <LineChart accessibilityLayer data={chartData} onClick={(el) => console.log(el)}>
          <CartesianGrid />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis
            dataKey="balance"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent formatter={(value, name, item, index) => {
              console.log(item.payload)
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-2">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                      style={
                        {
                          "--color-bg": `var(--color-${name})`,
                        } as React.CSSProperties
                      }
                    />
                    {chartConfig[name as keyof typeof chartConfig]?.label ||
                      name}
                    <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                      {toCurrency(value as number)}
                    </div>
                  </div>
                  {item.payload.account_id &&
                    <div className="flex flex-col">
                      <div>Description: {item.payload.description}</div>
                      <div>Amount: {toCurrency(item.payload.average_amount?.amount)}</div>
                    </div>
                  }
                </div>
              )
            }}
            />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="balance"
            type="monotone"
          />
        </LineChart>
      </ChartContainer>

      <RecurringTransactionsTable data={testData} />

    </div>
  )

}




export default ForecastCalendar
