import useBudgetVsActual from "@/app/hooks/useBudgetVsActual";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

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

export default function BudgetVsActual() {
  const { data } = useBudgetVsActual('2024-11')

  return (
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
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
            >
            </YAxis>

            <XAxis dataKey="spent" type="number" hide >
            </XAxis>
            <Bar dataKey="budget" fill="var(--chart-1)" radius={4}>
              <LabelList
                dataKey="budget"
                position="insideLeft"
                offset={8}
                fill="white"
                fontSize={12}
              />
            </Bar>
            <Bar dataKey="spent" fill="var(--chart-2)" radius={4}>
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
  )
}
