import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import Checkbox from "../common/Checkbox"
import TransactionActions from "./TransactionActions"
import { CSSProperties } from "react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import UserCategoryCell from "./UserCategoryCell"
import Image from "next/image"
import Transaction from "@/app/interfaces/transaction"

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
  columnHelper.accessor('merchant_name', {

    header: 'Merchant',
    cell: info => {
      return (
        <div className="flex items-center space-x-4">
          {info.row.original.logo_url &&
            <Image
              src={info.row.original.logo_url}
              alt="logo"
              width={30}
              height={30}
            />
          }

          <div>
            {info.getValue()}
          </div>
        </div>
      )
    }
  }),
  columnHelper.accessor('name', {
    header: 'Description',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('personal_finance_category', {
    header: 'Category',
    cell: info => {

      return (
        <div className="flex items-center space-x-4">
          {info.row.original.personal_finance_category_icon_url &&
            <Image
              src={info.row.original.personal_finance_category_icon_url}
              alt="logo"
              width={30}
              height={30}
            />
          }
          <div>
            {info.getValue()?.primary}
          </div>
        </div>
      )
    }
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
  columnHelper.accessor('pending', {
    header: 'Status',
    cell: info => info.getValue() ? 'Pending' : 'Posted'
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: info => {
      const amount = info.getValue() ?? 0
      const style: CSSProperties = {
        color: amount < 0 ? '	#00d062' : 'inherit'
      }
      return <span style={style}>{toCurrency(amount)}</span>
    },
    footer: (props) => {
      const total = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('amount')
        return sum + value
      }, 0)

      return (
        <div className="flex flex-col space-y-1">
          <div>Total: </div>
          <div className="font-bold">{toCurrency(total)}</div>
        </div>
      )
    }
  }),
  columnHelper.display({
    id: 'acitions',
    cell: ({ row }) => <TransactionActions transaction={row.original} />
  })
]

export default columns
