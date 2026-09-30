import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"
import { Category } from "@/app/interfaces/categories"
import CategoryActions from "./CategoryActions"
import { categoryTransactionsHref, toCurrency } from "@/app/helpers/helperFunctions"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { actualAmount } from "./amounts"
import BudgetInput from "./BudgetInput"
import { budgetFromActual, budgetFromAmount, LastMonthComparison, result } from "./lastMonth"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CategoryAverage } from "@/app/interfaces/categoryAverages"

const columnHelper = createColumnHelper<Category>()

// Re-exported: several budget components read it from here.
export { actualAmount }

export interface CompareOptions {
  lastMonth: LastMonthComparison
  // Short month names for headers, e.g. "Aug" and "Sep".
  lastMonthLabel: string
  thisMonthLabel: string
  setBudget: (category: Category, budget: number) => Promise<unknown>
  // Average actual over recent months (e.g. "6-mo avg", months "Apr–Sep");
  // undefined until loaded.
  average?: (category: Category) => CategoryAverage | undefined
  averageLabel: string
  averageRange: string
}

// A last-month figure that, when clicked, becomes this month's budget.
function FillButton({ amount, fill, hint, onFill }: { amount: number, fill: number, hint: string, onFill: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="-mr-2 h-7 px-2 font-normal tabular-nums text-muted-foreground" onClick={onFill}>
          {toCurrency(amount)}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{hint} ({toCurrency(fill)})</TooltipContent>
    </Tooltip>
  )
}

const sumFooter = (value: (category: Category) => number | undefined) =>
  function SumFooter(props: { table: { getRowModel: () => { rows: { original: Category }[] } } }) {
    const total = props.table.getRowModel().rows.reduce((sum, row) => sum + (value(row.original) ?? 0), 0)
    return <span className="font-semibold">{toCurrency(total)}</span>
  }

// Last month's budget, actual and result, placed before this month's editable budget.
function compareColumns({ lastMonth, lastMonthLabel, thisMonthLabel, setBudget, average, averageLabel, averageRange }: CompareOptions): ColumnDef<Category, any>[] {
  const last = (category: Category) => lastMonth.get(category)
  return [
    columnHelper.accessor(category => last(category)?.budget, {
      id: 'lastBudget',
      header: `${lastMonthLabel} budget`,
      meta: { align: 'right', width: 120 },
      cell: ({ row }) => {
        const previous = last(row.original)
        if (!previous) return <EmptyCell />
        const amount = previous.budget ?? 0
        return <FillButton amount={amount} fill={amount} hint={`Use as ${thisMonthLabel} budget`} onFill={() => setBudget(row.original, amount)} />
      },
      footer: sumFooter(category => last(category)?.budget),
    }),
    columnHelper.accessor(category => { const previous = last(category); return previous && actualAmount(previous) }, {
      id: 'lastActual',
      header: `${lastMonthLabel} actual`,
      meta: { align: 'right', width: 120 },
      cell: ({ row }) => {
        const previous = last(row.original)
        if (!previous) return <EmptyCell />
        return (
          <FillButton
            amount={actualAmount(previous)}
            fill={budgetFromActual(previous)}
            hint={`Use as ${thisMonthLabel} budget, rounded up`}
            onFill={() => setBudget(row.original, budgetFromActual(previous))}
          />
        )
      },
      footer: sumFooter(category => { const previous = last(category); return previous && actualAmount(previous) }),
    }),
    columnHelper.accessor(category => { const previous = last(category); return previous && result(previous).amount }, {
      id: 'lastResult',
      header: `${lastMonthLabel} result`,
      meta: { align: 'right', width: 130 },
      cell: ({ row }) => {
        const previous = last(row.original)
        if (!previous) return <EmptyCell />
        const { amount, label } = result(previous)
        return (
          <span className={cn("tabular-nums", amount > 0 && "text-positive", amount < 0 && "text-negative", amount === 0 && "text-muted-foreground")}>
            {label}
          </span>
        )
      },
    }),
    columnHelper.accessor(category => average?.(category)?.average, {
      id: 'average',
      header: averageLabel,
      meta: { align: 'right', width: 120 },
      cell: ({ row }) => {
        if (!average) return <span className="text-xs text-muted-foreground">…</span>
        const avg = average(row.original)
        if (!avg) return <EmptyCell />
        const fill = budgetFromAmount(avg.average)
        const over = avg.monthsCounted === 1 ? '1 month' : `${avg.monthsCounted} months`
        return (
          <FillButton
            amount={avg.average}
            fill={fill}
            hint={`Average of ${over} (${averageRange}). Use as ${thisMonthLabel} budget, rounded up`}
            onFill={() => setBudget(row.original, fill)}
          />
        )
      },
      footer: sumFooter(category => average?.(category)?.average),
    }),
  ]
}

export function getCategoryColumns(compare?: CompareOptions): ColumnDef<Category, any>[] {
  const columns = baseColumns.map(column => {
    if (!compare || column.id !== 'budget') return column
    return {
      ...column,
      meta: { align: 'right', width: 130 },
      cell: ({ row }) => (
        <BudgetInput
          key={row.original.budget ?? 0}
          value={row.original.budget}
          label={`${compare.thisMonthLabel} budget for ${row.original.name}`}
          onSave={budget => compare.setBudget(row.original, budget)}
        />
      ),
    } as ColumnDef<Category, any>
  })
  if (!compare) return columns
  // Read left to right: last month's numbers, then this month's budget.
  const at = columns.findIndex(column => column.id === 'budget')
  return [...columns.slice(0, at), ...compareColumns(compare), ...columns.slice(at)]
}

const baseColumns: ColumnDef<Category, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} />,
    meta: { width: 40 },
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => {
      const category = info.row.original
      if (!category._id || !category.date) return <span className="font-medium">{info.getValue()}</span>
      return (
        <Link href={categoryTransactionsHref(category)} className="font-medium hover:underline">
          {info.getValue()}
        </Link>
      )
    },
    meta: { truncate: true },
    footer: () => <span className="text-xs font-medium text-muted-foreground">Total</span>
  }),
  columnHelper.accessor('budget', {
    id: 'budget',
    header: 'Budget',
    meta: { align: 'right', width: 120 },
    cell: info => toCurrency(info.getValue() ?? 0),
    footer: props => {
      const total = props.table.getRowModel().rows.reduce((sum, row) => sum + (row.original.budget ?? 0), 0)
      return <span className="font-semibold">{toCurrency(total)}</span>
    }
  }),
  columnHelper.accessor(actualAmount, {
    id: 'spent',
    header: 'Actual',
    meta: { align: 'right', width: 120 },
    cell: info => toCurrency(info.getValue()),
    footer: props => {
      const total = props.table.getRowModel().rows.reduce((sum, row) => sum + actualAmount(row.original), 0)
      return <span className="font-semibold">{toCurrency(total)}</span>
    }
  }),
  columnHelper.display({
    id: 'progress',
    header: 'Progress',
    cell: (info) => {
      const { budget, spent, type } = info.row.original
      let percent: number = 0
      if (budget && spent) percent = Math.round(((Math.abs(spent)) / budget) * 100)

      // Spending categories are on track at or under budget; income
      // categories are on track once they reach their planned amount.
      const actual = Math.abs(spent ?? 0)
      const onTrack = type === 'income' ? actual >= (budget ?? 0) : actual <= (budget ?? 0)

      return (
        <div className="flex w-full items-center gap-3">
          <Progress
            className="h-2.5"
            value={Math.min(percent, 100)}
            indicatorClassName={onTrack ? 'bg-positive' : 'bg-negative'}
          />
          <span className="min-w-[3rem] text-right text-xs tabular-nums text-muted-foreground">{percent}%</span>
        </div>
      )
    },
    meta: { width: 320 },
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => info.getValue() || <EmptyCell />
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    enableHiding: true,
    cell: info => info.getValue() ? <span className="capitalize">{info.getValue()}</span> : <EmptyCell />
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <CategoryActions category={row.original} />,
    meta: { width: 48 },
  })
]

export default getCategoryColumns()
