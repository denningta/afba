import Transaction from "@/app/interfaces/transaction"
import { createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import TransactionActions from "./TransactionActions"
import AutoComplete from "../common/AutoComplete"
import { Category } from "@/app/interfaces/categories"
import useCategories from "@/app/hooks/useCategories"
import { SyntheticEvent } from "react"
import useTransactions from "@/app/hooks/useTransactions"
import { dateToYYYYMM, getMonthString } from "@/app/helpers/helperFunctions"
import { ObjectId } from "mongodb"

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
    cell: info => {
      const date = dateToYYYYMM(new Date(info.row.getValue('date')))
      const { data } = useCategories({ date: date })
      const { upsertRecord } = useTransactions()

      const updateTransaction = async (
        event: SyntheticEvent<Element, Event>,
        category: Category | null
      ) => {
        const transaction: Transaction = {
          ...info.row.original,
          userCategory: category ?? undefined
        }

        await upsertRecord(transaction)
      }

      return (
        <AutoComplete
          options={data ?? []}
          value={info.row.original.userCategory ?? null}
          isOptionEqualToValue={(option, value) => (option?._id === value?._id)}
          getOptionLabel={(option) => option.name ?? ''}
          onChange={(event, value) => updateTransaction(event, value)}
          autoHighlight={true}
        />
      )

    }
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: info => info.getValue()
  }),
  columnHelper.display({
    id: 'acitions',
    cell: ({ row }) => <TransactionActions transaction={row.original} />
  })
]

export default columns
