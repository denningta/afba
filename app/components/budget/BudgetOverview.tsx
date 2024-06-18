'use client'

import { Category } from "@/app/interfaces/categories"
import { Card } from "@tremor/react"
import { ParentSize } from "@visx/responsive"
import BudgetOverviewChart from "./BudgetOverviewChart"

export interface BudgetOverviewProps {
  data: BudgetOverview[]
}

export interface BudgetOverview {
  _id: {
    year: number
    month: number
  }
  date: string
  totalBudget: number
  totalSpent: number
  categories: Category[]
}

const BudgetOverview = ({ data }: BudgetOverviewProps) => {
  console.log(data)

  return (
    <>
      <Card style={{ height: 600 }}>
        <ParentSize>
          {({ width, height }) =>
            <BudgetOverviewChart data={data} width={width} height={height} />
          }
        </ParentSize>
      </Card>
    </>
  )

}

export default BudgetOverview
