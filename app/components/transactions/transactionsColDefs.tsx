import Transaction from "@/app/interfaces/transaction"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import TransactionActions from "./TransactionActions"
import { CSSProperties } from "react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import UserCategoryCell from "./UserCategoryCell"

const columnHelper = createColumnHelper<Transaction>()

const columns: ColumnDef<Transaction, any>[] = [
  columnHelper.display({
    id: 'select',
    cell: ({ row }) =>
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        tabIndex={-1}
      />,
    header: ({ table }) =>
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        tabIndex={-1}
      />,
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('month', {
    header: 'Month',
    cell: info => info.getValue(),
    meta: {
      filterVariant: 'select'
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
  columnHelper.accessor('userCategory', {
    header: 'User Category',
    cell: UserCategoryCell,
    filterFn: (row, columnId, filterValue) => {
      const data = row.getValue(columnId) as any
      if (!filterValue) return true
      if (!data && filterValue === 'unassigned') return true
      if (data && data.name === filterValue) return true
      return false
    },
    meta: {
      filterVariant: 'select',
    }
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: info => {
      const amount = info.getValue() ?? 0
      const style: CSSProperties = {
        color: amount > 0 ? '	#00d062' : 'inherit'
      }
      return <span style={style}>{toCurrency(amount)}</span>
    }
  }),
  columnHelper.display({
    id: 'acitions',
    cell: ({ row }) => <TransactionActions transaction={row.original} />
  })
]

export default columns
