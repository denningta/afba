import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import { Category } from "@/app/interfaces/categories"
import { Icon, ProgressBar } from "@tremor/react"
import { RiDeleteBinFill, RiPencilFill } from "@remixicon/react"
import CategoryActions from "./CategoryActions"

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
    cell: info => info.getValue()
  }),
  columnHelper.accessor('budget', {
    header: 'Budget',
    cell: info => '$' + info.getValue()?.toLocaleString()
  }),
  columnHelper.accessor('spent', {
    header: 'Spent',
    cell: (info) => info.getValue()
  }),
  columnHelper.display({
    id: 'progress',
    header: 'Progress',
    cell: (info) => {
      const { budget, spent } = info.row.original
      let percent: number = 0
      if (budget && spent) percent = Math.round(((Math.abs(spent)) / budget) * 100)

      return (
        <div className="flex w-full">
          <span className="min-w-[40px]">{percent}%</span>
          <ProgressBar value={percent} color={percent <= 100 ? 'emerald' : 'rose'} />
        </div>
      )
    }
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => info.getValue()
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <CategoryActions category={row.original} />
  })
]

export default categoryColumns
