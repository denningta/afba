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
import { DataTable } from "../common/DataTable/DataTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BudgetVsActual from "./BudgetVsActual"
import BudgetAccountsPicker from "./BudgetAccountsPicker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { Amount } from "../transactions/TransactionCells"
import { DEFAULT_TRANSACTION_COLUMN_VISIBILITY } from "../transactions/TransactionsTable"

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



const BudgetOverviewComponent = ({ }: BudgetOverviewProps) => {
  const { data } = useBudgetOverview()
  const [start, setStart] = useState(getDefaultStart())
  const [end, setEnd] = useState(getDefaultEnd())
  const [transactionData, setTransactionData] = useState<Transaction[]>([])
  const [budgetNav, setBudgetNav] = useState<string | null>(null)


  const handleFilterChange = (data: BarStackData | null) => {
    setTransactionData(data?.transactions ?? [])
    setBudgetNav(data?.date ?? null)
  }

  const selectedTotal = transactionData.reduce((sum, t) => sum + (t.amount ?? 0), 0)

  return (
    <Tabs defaultValue="overview" className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="actual">Actual vs Savings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Budget vs spending</CardTitle>
              <CardDescription>Click a month to see its transactions.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BudgetAccountsPicker />
              <MonthRangePicker
                value={{ from: new Date(start), to: new Date(end) }}
                onRangeChange={(range) => {
                  if (!range) return
                  setStart(dateToYYYYMM(range.from))
                  setEnd(dateToYYYYMM(range.to))
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[420px]">
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
          </CardContent>
        </Card>

        {budgetNav &&
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {format(YYYYMMToDate(budgetNav), "MMMM yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {transactionData.length} transaction{transactionData.length === 1 ? '' : 's'}
                  {' · '}
                  <Amount value={selectedTotal} className="font-normal" /> total
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/budget/${budgetNav}`}>Open budget <ArrowRight /></Link>
              </Button>
            </div>
            <DataTable
              columns={columns}
              data={transactionData}
              columnVisibilityStorageKey="afba:transactions-columns"
              defaultColumnVisibility={DEFAULT_TRANSACTION_COLUMN_VISIBILITY}
            />
          </section>
        }
      </TabsContent>

      <TabsContent value="actual">
        <BudgetVsActual />
      </TabsContent>
    </Tabs>
  )

}

export default BudgetOverviewComponent
