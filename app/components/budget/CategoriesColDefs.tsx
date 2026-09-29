import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"
import { Category } from "@/app/interfaces/categories"
import CategoryActions from "./CategoryActions"
import { categoryTransactionsHref, toCurrency } from "@/app/helpers/helperFunctions"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

const columnHelper = createColumnHelper<Category>()

// Spent follows Plaid's sign convention (money in is negative), so flip income
// rows to show what was actually received as a positive amount.
export const actualAmount = (category: Category) =>
  category.type === 'income' ? -(category.spent ?? 0) : (category.spent ?? 0)

const categoryColumns: ColumnDef<Category, any>[] = [
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

export default categoryColumns
