import Transaction from "@/app/interfaces/transaction"
import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import TransactionActions from "./TransactionActions"
import AutoComplete from "../common/AutoComplete"
import { Category } from "@/app/interfaces/categories"
import useCategories from "@/app/hooks/useCategories"
import { CSSProperties, SyntheticEvent } from "react"
import useTransactions from "@/app/hooks/useTransactions"
import { dateToYYYYMM, getMonthString, toCurrency } from "@/app/helpers/helperFunctions"
import { ObjectId } from "mongodb"
import UserCategoryCell from "./UserCategoryCell"

const columnHelper = createColumnHelper<Transaction>()

const columns = [
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
    cell: info => info.getValue(),
    size: 100
  }),
  columnHelper.accessor('month', {
    header: 'Month',
    cell: info => info.getValue()
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
    cell: UserCategoryCell
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
