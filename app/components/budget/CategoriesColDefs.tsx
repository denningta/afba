import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import { Category } from "@/app/interfaces/categories"
import CategoryActions from "./CategoryActions"
import { CSSProperties, useMemo } from "react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const columnHelper = createColumnHelper<Category>()

const categoryColumns = [
  columnHelper.display({
    id: 'select',
    cell: ({ row }) =>
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />,
    header: ({ table }) =>
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />,
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => info.getValue(),
    footer: () => <div className="flex flex-col items-end pr-3">
      <div>Deduction Total:</div>
      <div>Gross Total:</div>
    </div>
  }),
  columnHelper.accessor('budget', {
    header: 'Budget',
    cell: info => {
      const row = info.row.original as Category
      const budget = info.getValue() ?? 0

      const style: CSSProperties = {
        color: row.type === 'income' ? '#00d062' : 'inherit'
      }
      return <span style={style}>{toCurrency(budget)}</span>
    },
    footer: props => {
      const deductionTotal = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('budget')
        if (row.getValue('type') === 'income') return 0
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
    cell: info => {
      const spent = info.getValue() ?? 0
      const style: CSSProperties = {
      }
      return <span style={style}>{toCurrency(spent)}</span>
    },
    footer: props => {
      const deductionTotal = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('spent')
        if (row.getValue('type') === 'income') return 0
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
      const { budget, spent } = info.row.original
      let percent: number = 0
      if (budget && spent) percent = Math.round(((Math.abs(spent)) / budget) * 100)

      return (
        <div className="flex w-full items-center space-x-2">
          <Progress value={percent} />
          <span className="min-w-[40px] text-xs">{percent}%</span>
        </div>
      )
    }
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    enableHiding: true,
    cell: info => info.getValue()
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <CategoryActions category={row.original} />
  })
]

export default categoryColumns
