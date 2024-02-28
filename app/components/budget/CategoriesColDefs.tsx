import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import { Category } from "@/app/interfaces/categories"
import { Icon } from "@tremor/react"
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
    cell: info => info.getValue()
  }),
  columnHelper.display({
    id: 'spent',
    header: 'Spent'
  }),
  columnHelper.display({
    id: 'progress',
    header: 'Progress'
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => {
      const value = info.getValue()
      return value ? new Date(value).toLocaleDateString() : ''
    }
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <CategoryActions category={row.original} />
  })
]

export default categoryColumns
