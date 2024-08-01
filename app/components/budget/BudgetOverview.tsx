'use client'

import { Category } from "@/app/interfaces/categories"
import { Card, DateRangePicker } from "@tremor/react"
import { ParentSize } from "@visx/responsive"
import BudgetOverviewChart from "./BudgetOverviewChart"
import useBudgetOverview from "@/app/hooks/useBudgetOverview"
import Label from "../common/Label"
import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import { useState } from "react"
import MonthPicker from "../common/MonthPicker"

export interface BudgetOverviewProps {
}

export interface BudgetOverview {
  _id: string
  date: string
  totalBudget: number
  totalSpent: number
  categories: Category[]
}

const getDefaultStart = () => {
  const start = new Date()
  start.setMonth(start.getMonth() - 11)
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

  return (
    <>
      <Card>
        <div className="flex justify-end space-x-3 mb-4">
          <div>
            <Label >
              Start
            </Label>
            <MonthPicker
              value={start}
              onChange={(e) => setStart(e.currentTarget.value)}
            />
          </div>

          <div>
            <Label>
              End
            </Label>
            <MonthPicker
              value={end}
              onChange={(e) => setEnd(e.currentTarget.value)}
            />
          </div>
        </div>


        <div style={{ height: 600 }}>
          <ParentSize>
            {({ width, height }) =>
              <BudgetOverviewChart
                data={data ?? []}
                start={start}
                end={end}
                width={width}
                height={height}
              />
            }
          </ParentSize>
        </div>
      </Card>
    </>
  )

}

export default BudgetOverviewComponent
