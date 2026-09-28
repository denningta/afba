import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"
import { Category } from "@/app/interfaces/categories"
import CategoryActions from "./CategoryActions"
import { CSSProperties } from "react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Progress } from "@/components/ui/progress"

const columnHelper = createColumnHelper<Category>()

const categoryColumns: ColumnDef<Category, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} />,
    meta: { width: 40 },
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => <span className="font-medium">{info.getValue()}</span>,
    meta: { truncate: true },
    footer: () => <div className="flex flex-col items-end pr-3 text-xs text-muted-foreground">
      <div>Deduction Total:</div>
      <div>Gross Total:</div>
    </div>
  }),
  columnHelper.accessor('budget', {
    header: 'Budget',
    meta: { align: 'right', width: 120 },
    cell: info => {
      const row = info.row.original as Category
      const budget = info.getValue() ?? 0

      const style: CSSProperties = {
        color: row.type === 'income' ? 'var(--positive)' : 'inherit'
      }
      return <span style={style}>{toCurrency(budget)}</span>
    },
    footer: props => {
      const deductionTotal = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('budget')
        if (row.getValue('type') === 'income') return sum
        return sum + value
      }, 0)

      const total = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('budget')
        return sum + value
      }, 0)

      return (
        <div>
          <div>{toCurrency(deductionTotal)}</div>
          <div>{toCurrency(total)}</div>
        </div>
      )
    }
  }),
  columnHelper.accessor('spent', {
    header: 'Spent',
    meta: { align: 'right', width: 120 },
    cell: info => {
      const spent = info.getValue() ?? 0
      const style: CSSProperties = {
      }
      return <span style={style}>{toCurrency(spent)}</span>
    },
    footer: props => {
      const deductionTotal = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('spent')
        if (row.getValue('type') === 'income') return sum
        return sum + value
      }, 0)

      const grandTotal = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('spent')
        return sum + value
      }, 0)

      return (
        <div>
          <div>{toCurrency(deductionTotal)}</div>
          <div>{toCurrency(grandTotal)}</div>
        </div>
      )

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
