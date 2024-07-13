'use client'

import { Category } from "@/app/interfaces/categories"
import { Card } from "@tremor/react"
import { ParentSize } from "@visx/responsive"
import BudgetOverviewChart from "./BudgetOverviewChart"
import useBudgetOverview from "@/app/hooks/useBudgetOverview"

export interface BudgetOverviewProps {
}

export interface BudgetOverview {
  _id: string
  date: string
  totalBudget: number
  totalSpent: number
  categories: Category[]
}

const BudgetOverviewComponent = ({ }: BudgetOverviewProps) => {
  const { data } = useBudgetOverview()

  return (
    <>
      <Card style={{ height: 600 }}>
        <ParentSize>
          {({ width, height }) =>
            <BudgetOverviewChart data={data ?? []} width={width} height={height} />
          }
        </ParentSize>
      </Card>
    </>
  )

}

export default BudgetOverviewComponent
