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

  console.log(data)

  const handleFilterChange = (data: BarStackData | null) => {
    setTransactionData(data?.transactions ?? [])
    setBudgetNav(data?.date ?? null)
  }


  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">

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
