import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import TransactionActions from "./TransactionActions"
import { formatShortDate, humanizeEnum, toCurrency } from "@/app/helpers/helperFunctions"
import UserCategoryCell from "./UserCategoryCell"
import AmazonOrderLink from "./AmazonOrderLink"
import Image from "next/image"
import Transaction from "@/app/interfaces/transaction"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"

const columnHelper = createColumnHelper<Transaction>()

// Amazon's own transaction history has line-item detail Plaid doesn't give us,
// which helps decide how a purchase should actually be categorized.
export const AMAZON_TRANSACTIONS_URL = "https://www.amazon.com/cpe/yourpayments/transactions"

// A missing account_id is a manual/CSV transaction; a missing `account` with an
// account_id means the account isn't in the local cache (e.g. since unlinked).
const accountLabel = ({ account, account_id }: Transaction) => {
  if (account) return account.mask ? `${account.name} ••${account.mask}` : account.name
  return account_id ? 'Unknown account' : 'Manual / Imported'
}

const accountSubtype = ({ account, account_id }: Transaction) => {
  if (account) return account.subtype ?? account.type
  return account_id ? 'unknown' : 'manual'
}

// Plaid amounts are positive for money out. Show income as a green "+$X" and
// spending as a plain "$X".
function Amount({ value, className }: { value: number, className?: string }) {
  const income = value < 0
  return (
    <span className={cn("font-medium tabular-nums", income && "text-positive", className)}>
      {income ? '+' : ''}{toCurrency(Math.abs(value))}
    </span>
  )
}

// 24px logo, or a letter placeholder so names line up either way.
function MerchantLogo({ src, name }: { src?: string | null, name: string }) {
  if (src) {
    return <Image src={src} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full" />
  }
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {name.charAt(0).toUpperCase() || '?'}
    </span>
  )
}

const columns: ColumnDef<Transaction, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} />,
    meta: { width: 40 },
  }),
  columnHelper.accessor('date', {
    header: 'Date',
    cell: info => (
      <span className="tabular-nums text-muted-foreground" title={info.getValue()}>
        {formatShortDate(info.getValue())}
      </span>
    ),
    meta: { width: 96 },
  }),
  columnHelper.accessor('month', {
    header: 'Month',
    cell: info => info.getValue() || <EmptyCell />,
    meta: {
      filterVariant: 'select'
    }
  }),
  columnHelper.accessor('merchant_name', {
    header: 'Merchant',
    cell: info => {
      const transaction = info.row.original
      const merchant = info.getValue() || transaction.name
      const isAmazon = info.getValue()?.toLowerCase() === 'amazon'

      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <MerchantLogo src={transaction.logo_url} name={merchant} />
          <span
            className={cn("truncate font-medium", transaction.pending && "text-muted-foreground")}
            title={merchant}
          >
            {merchant}
          </span>
          {transaction.pending &&
            <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">Pending</Badge>
          }
          {isAmazon &&
            <AmazonOrderLink transaction={transaction} />
          }
        </div>
      )
    },
    meta: { truncate: true },
  }),
  columnHelper.accessor('name', {
    header: 'Description',
    cell: info => <span className="text-muted-foreground">{info.getValue() || <EmptyCell />}</span>,
    meta: { truncate: true },
  }),
  columnHelper.accessor(accountLabel, {
    id: 'account',
    header: 'Account',
    cell: info => <span className="text-muted-foreground">{info.getValue()}</span>,
    meta: {
      filterVariant: 'select',
      truncate: true,
    }
  }),
  columnHelper.accessor(accountSubtype, {
    id: 'accountSubtype',
    header: 'Account Type',
    cell: info => <span className="capitalize text-muted-foreground">{info.getValue()}</span>,
    meta: {
      filterVariant: 'select'
    }
  }),
  columnHelper.accessor('personal_finance_category', {
    header: 'Category',
    cell: info => {
      const primary = info.getValue()?.primary
      if (!primary) return <EmptyCell />

      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          {info.row.original.personal_finance_category_icon_url &&
            <Image
              src={info.row.original.personal_finance_category_icon_url}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0"
            />
          }
          <span>{humanizeEnum(primary)}</span>
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
    cell: info => info.getValue() ? 'Pending' : 'Posted',
    meta: { width: 96 },
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    meta: { align: 'right', width: 120 },
    cell: info => <Amount value={info.getValue() ?? 0} />,
    footer: (props) => {
      const total = props.table.getRowModel().rows.reduce((sum, row) => {
        const value: number = row.getValue('amount')
        return sum + value
      }, 0)

      return (
        <div className="flex flex-col space-y-1">
          <div className="text-xs text-muted-foreground">Total</div>
          <Amount value={total} className="font-semibold" />
        </div>
      )
    }
  }),
  columnHelper.display({
    id: 'acitions',
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
    meta: { width: 48 },
  })
]

export default columns
