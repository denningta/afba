'use client'

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import useBudgetVsActual from "@/app/hooks/useBudgetVsActual";
import { dateToYYYYMM, toCurrency } from "@/app/helpers/helperFunctions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import MonthPicker from "@/components/ui/month-picker";
import { EmptyState, ErrorState } from "../common/StateMessage";

const chartConfig = {
  budget: {
    label: "Budget",
    color: "var(--chart-1)",
  },
  spent: {
    label: "Actual",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

// Each category gets a pair of bars; size the chart to fit them all.
const ROW_HEIGHT = 44

export default function BudgetVsActual() {
  const [month, setMonth] = useState(() => dateToYYYYMM(new Date()))
  const { data, isLoading, error, mutate } = useBudgetVsActual(month)
  const categories = data?.find(el => el.date === month)?.categories ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs actual</CardTitle>
        <CardDescription>Planned and actual amounts for each category.</CardDescription>
        <CardAction>
          <MonthPicker
            value={new Date(`${month}-01T00:00:00`)}
            onValueChange={(date) => setMonth(dateToYYYYMM(date))}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {error && <ErrorState error={error} onRetry={() => mutate()} />}
        {isLoading && <Skeleton className="h-72 w-full" />}
        {!isLoading && !error && categories.length === 0 &&
          <EmptyState title="No budget categories for this month" description="Pick another month, or plan this one on the Budget page." />
        }
        {!isLoading && !error && categories.length > 0 &&
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: categories.length * ROW_HEIGHT + 60 }}
          >
            <BarChart
              accessibilityLayer
              data={categories}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
              barGap={2}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={140}
                tickFormatter={(value: string) => value.length > 18 ? `${value.slice(0, 17)}…` : value}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => toCurrency(Number(value)).replace(/\.\d\d$/, '')}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: `var(--color-${name})` }}
                        />
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                          {toCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="budget" fill="var(--color-budget)" radius={4} />
              <Bar dataKey="spent" fill="var(--color-spent)" radius={4} />
            </BarChart>
          </ChartContainer>
        }
      </CardContent>
    </Card>
  )
}
