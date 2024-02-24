import Transaction from "@/app/interfaces/transaction"
import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"

const columnHelper = createColumnHelper<Transaction>()

const columns = [
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
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => {
      const value = new Date(info.getValue())
      return value.toLocaleDateString()
    }
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('originalDescription', {
    header: 'Original Description',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: info => info.getValue()
  }),
]

export default columns
