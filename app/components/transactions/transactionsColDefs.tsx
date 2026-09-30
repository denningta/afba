import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import TransactionActions from "./TransactionActions"
import { formatShortDate, humanizeEnum, parseDisplayDate } from "@/app/helpers/helperFunctions"
import UserCategoryCell from "./UserCategoryCell"
import AmazonOrderLink from "./AmazonOrderLink"
import Image from "next/image"
import Transaction from "@/app/interfaces/transaction"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"
import { Amount, MerchantLogo } from "./TransactionCells"
import { FilterOptionGroup } from "../common/ColumnFilter"
import { format, subMonths } from "date-fns"
import { Category } from "@/app/interfaces/categories"

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

// `month` is "MM-YYYY", which sorts wrong as text; offer newest first, by year.
const monthFilterOptions = (facets: Map<any, number>): FilterOptionGroup[] => {
  const months = Array.from(facets.entries())
    .filter(([value]) => typeof value === 'string' && /^\d{2}-\d{4}$/.test(value))
    .map(([value, count]: [string, number]) => {
      const [mm, yyyy] = value.split('-').map(Number)
      return { value, count, date: new Date(yyyy, mm - 1, 1) }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const byYear = new Map<number, FilterOptionGroup>()
  for (const { value, count, date } of months) {
    const year = date.getFullYear()
    if (!byYear.has(year)) byYear.set(year, { heading: String(year), options: [] })
    byYear.get(year)!.options.push({ value, label: format(date, 'MMMM yyyy'), count })
  }
  return Array.from(byYear.values())
}

// How far back (from the newest category in view) a category still counts as
// in use; anything older is tucked away until asked for or searched.
const RECENT_CATEGORY_MONTHS = 3

// Every month has its own copy of each category, so there's one option per
// name. Categories are split into ones used recently and retired ones.
const userCategoryFilterOptions = (facets: Map<any, number>): FilterOptionGroup[] => {
  let unassigned = 0
  const byName = new Map<string, { count: number, latest: string }>()
  facets.forEach((count, category: Category | undefined) => {
    if (!category?.name) {
      unassigned += count
      return
    }
    const entry = byName.get(category.name) ?? { count: 0, latest: '' }
    entry.count += count
    if ((category.date ?? '') > entry.latest) entry.latest = category.date ?? ''
    byName.set(category.name, entry)
  })

  const newest = Array.from(byName.values()).reduce((max, { latest }) => latest > max ? latest : max, '')
  const cutoff = newest
    ? format(subMonths(new Date(`${newest}-01T00:00:00`), RECENT_CATEGORY_MONTHS - 1), 'yyyy-MM')
    : ''

  const recent: FilterOptionGroup = { heading: 'Categories', options: [] }
  const older: FilterOptionGroup = { heading: 'Older categories', options: [], collapsed: true }
  Array.from(byName.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, { count, latest }]) =>
      (latest >= cutoff ? recent : older).options.push({ value: name, label: name, count })
    )

  const groups = [recent, older]
  if (unassigned) groups.unshift({ options: [{ value: 'unassigned', label: 'Unassigned', count: unassigned }] })
  return groups
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
    // Stored as MM/DD/YYYY, which doesn't sort as text across years.
    sortingFn: (a, b) =>
      (parseDisplayDate(a.original.date)?.getTime() ?? 0) - (parseDisplayDate(b.original.date)?.getTime() ?? 0),
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
    filterFn: 'equalsString',
    meta: {
      filterVariant: 'select',
      filterOptions: monthFilterOptions,
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
      filterOptions: userCategoryFilterOptions,
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
  }),
  columnHelper.display({
    id: 'acitions',
    cell: ({ row }) => <TransactionActions transaction={row.original} />,
    meta: { width: 48 },
  })
]

export default columns
