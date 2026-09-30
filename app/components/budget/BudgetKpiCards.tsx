'use client'

import { Category } from "@/app/interfaces/categories"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import getBudgetKpis from "./kpis"
import { useState } from "react"
import KpiBreakdownSheet, { BudgetKpiKey } from "./KpiBreakdownSheet"
import { ExplainTrigger } from "../common/ExplainSheet"

interface KpiCardProps {
  label: string
  value: number
  isLoading?: boolean
  // Secondary line under the value; `tone` colors it (with an arrow icon so
  // the meaning never rests on color alone).
  detail?: React.ReactNode
  tone?: 'positive' | 'negative' | 'muted'
  // 0-100+, drawn as a thin bar under the detail line.
  progress?: number
  progressTone?: 'positive' | 'negative'
  onExplain?: () => void
}

function KpiCard({ label, value, isLoading, detail, tone = 'muted', progress, progressTone = 'positive', onExplain }: KpiCardProps) {
  const ToneIcon = tone === 'positive' ? ArrowUpRight : tone === 'negative' ? ArrowDownRight : null

  const card = (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {isLoading ? <Skeleton className="h-8 w-32" /> : toCurrency(value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-4 w-40" /> :
          <div className={cn(
            "flex items-center gap-1 text-sm",
            tone === 'positive' && "text-positive",
            tone === 'negative' && "text-negative",
            tone === 'muted' && "text-muted-foreground",
          )}>
            {ToneIcon && <ToneIcon className="size-4 shrink-0" />}
            {detail}
          </div>
        }
        {progress !== undefined && !isLoading &&
          <Progress
            className="h-1.5"
            value={Math.min(progress, 100)}
            indicatorClassName={progressTone === 'positive' ? 'bg-positive' : 'bg-negative'}
          />
        }
      </CardContent>
    </Card>
  )

  return onExplain && !isLoading ? <ExplainTrigger onClick={onExplain}>{card}</ExplainTrigger> : card
}

const percentOf = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 100) : 0

// Income / Budgeted / Spent / Left to spend for one month of categories. Each
// card opens a breakdown of the math and transactions behind it.
export default function BudgetKpiCards({ data, isLoading, month }: {
  data: Category[] | undefined
  isLoading?: boolean
  month: string // YYYY-MM
}) {
  const [explaining, setExplaining] = useState<BudgetKpiKey | null>(null)
  const { plannedIncome, plannedBudget, plannedDiff, actualIncome, actualSpent, actualDiff } = getBudgetKpis(data)
  const leftToSpend = plannedBudget.value - actualSpent.value
  const spentPercent = percentOf(actualSpent.value, plannedBudget.value)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Income"
          onExplain={() => setExplaining('income')}
          value={actualIncome.value}
          isLoading={isLoading}
          detail={`of ${toCurrency(plannedIncome.value)} planned`}
          progress={percentOf(actualIncome.value, plannedIncome.value)}
        />
        <KpiCard
          label="Budgeted"
          onExplain={() => setExplaining('budgeted')}
          value={plannedBudget.value}
          isLoading={isLoading}
          tone={plannedDiff.value < 0 ? 'negative' : 'muted'}
          detail={plannedDiff.value < 0
            ? `${toCurrency(-plannedDiff.value)} more than planned income`
            : `${toCurrency(plannedDiff.value)} of income unassigned`}
        />
        <KpiCard
          label="Spent"
          onExplain={() => setExplaining('spent')}
          value={actualSpent.value}
          isLoading={isLoading}
          detail={`${spentPercent}% of budget`}
          progress={spentPercent}
          progressTone={spentPercent > 100 ? 'negative' : 'positive'}
        />
        <KpiCard
          label="Left to spend"
          onExplain={() => setExplaining('leftToSpend')}
          value={leftToSpend}
          isLoading={isLoading}
          tone={actualDiff.value >= 0 ? 'positive' : 'negative'}
          detail={`Net cash flow ${actualDiff.value >= 0 ? '+' : '−'}${toCurrency(Math.abs(actualDiff.value))}`}
        />
      </div>
      <KpiBreakdownSheet
        kpi={explaining}
        onOpenChange={(open) => !open && setExplaining(null)}
        data={data}
        month={month}
      />
    </>
  )
}
