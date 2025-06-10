'use client'

import { Category } from "@/app/interfaces/categories"
import { Button } from "components/ui/button"
import { ParentSize } from "@visx/responsive"
import BudgetOverviewChart, { BarStackData } from "./BudgetOverviewChart"
import useBudgetOverview from "@/app/hooks/useBudgetOverview"
import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import { useState } from "react"
import columns from "../transactions/transactionsColDefs"
import Transaction from "@/app/interfaces/transaction"
import Link from "next/link"
import MonthRangePicker from "@/components/ui/month-range-picker"
import { DataTable } from "../common/DataTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import useBudgetVsActual from "@/app/hooks/useBudgetVsActual"

export interface BudgetOverviewProps {
}

export interface BudgetOverview {
  _id: string
  date: string
  totalBudget: number
  totalSpent: number
  categories: Category[]
  transactions: Transaction[]
}


const getDefaultStart = () => {
  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  return dateToYYYYMM(start)
}

const getDefaultEnd = () => {
  const end = new Date()
  end.setMonth(end.getMonth() + 2)
  return dateToYYYYMM(end)
}

const chartConfig = {
  budget: {
    label: "Budget",
    color: "var(--chart-1)",
  },
  spent: {
    label: "Spent",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig


const BudgetOverviewComponent = ({ }: BudgetOverviewProps) => {
  // const { data } = useBudgetOverview()
  const { data } = useBudgetVsActual('2024-11')
  const [start, setStart] = useState(getDefaultStart())
  const [end, setEnd] = useState(getDefaultEnd())
  const [transactionData, setTransactionData] = useState<Transaction[]>([])
  const [budgetNav, setBudgetNav] = useState<string | null>(null)


  const handleFilterChange = (data: BarStackData | null) => {
    setTransactionData(data?.transactions ?? [])
    setBudgetNav(data?.date ?? null)
  }

  console.log(data)


  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">

          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
              <CardDescription>{data?.findLast(el => el.date)?.date}</CardDescription>

            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart
                  accessibilityLayer
                  data={data?.findLast(el => el.date)?.categories}
                  layout="vertical"
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={true}
                  >
                  </YAxis>

                  <XAxis dataKey="spent" type="number" hide >
                  </XAxis>
                  <Bar dataKey="budget" layout="vertical" fill="blue" radius={4}>
                    <LabelList
                      dataKey="budget"
                      position="insideLeft"
                      offset={8}
                      fill="white"
                      fontSize={12}
                    />
                  </Bar>
                  <Bar dataKey="spent" layout="vertical" fill="red" radius={4}>
                    <LabelList
                      dataKey="spent"
                      position="insideLeft"
                      offset={8}
                      fill="white"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>

            </CardContent>

          </Card>



          <div className="flex justify-end space-x-3 mb-4">
            <MonthRangePicker
              value={{ from: new Date(start), to: new Date(end) }}
              onRangeChange={(range) => {
                if (!range) return
                setStart(dateToYYYYMM(range.from))
                setEnd(dateToYYYYMM(range.to))
              }}
            />
          </div>


          <div style={{ height: 600 }} className="mb-6">
            <ParentSize>
              {({ width, height }) =>
                <BudgetOverviewChart
                  data={data ?? []}
                  start={start}
                  end={end}
                  width={width}
                  height={height}
                  onFilterChange={handleFilterChange}
                />
              }
            </ParentSize>
          </div>
        </TabsContent>
        <TabsContent value="savings">
        </TabsContent>
      </Tabs>

      {budgetNav &&
        <Link href={`/budget/${budgetNav}`}>
          <Button>Go to budget</Button>
        </Link>

      }

      <DataTable
        columns={columns}
        data={transactionData}
      />
    </div>
  )

}

export default BudgetOverviewComponent
