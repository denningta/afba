import Transaction from "@/app/interfaces/transaction"
import { Checkbox } from "@mui/material"
import { createColumnHelper } from "@tanstack/react-table"

const columnHelper = createColumnHelper<Transaction>()

const columns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) =>
      <Checkbox
        size="small"
        disableRipple
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />,
    cell: ({ row }) =>
      <Checkbox
        size="small"
        disableRipple
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
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
