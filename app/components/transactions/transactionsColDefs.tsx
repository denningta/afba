import { Column, ColumnDef, createColumnHelper } from "@tanstack/react-table"
import TransactionActions from "./TransactionActions"
import { formatShortDate, humanizeEnum, parseDisplayDate } from "@/app/helpers/helperFunctions"
import UserCategoryCell from "./UserCategoryCell"
import AmazonOrderLink from "./AmazonOrderLink"
import Image from "next/image"
import Transaction, { needsCategory, transactionLabel } from "@/app/interfaces/transaction"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EmptyCell, SelectAllCheckbox, SelectRowCheckbox } from "../common/DataTable/cells"
import { Amount, MerchantLogo } from "./TransactionCells"
import { FilterOptionGroup } from "../common/ColumnFilter"
import { groupCategoriesByRecency } from "../common/categoryFilterOptions"
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


// What the Merchant column shows: the user's rename, else Plaid's merchant
// name, else the description (e.g. transfers, manual transactions).
const merchantLabel = transactionLabel

// Merchants by how often they appear (the list is long; search finds the rest).
const merchantFilterOptions = (facets: Map<any, number>): FilterOptionGroup[] => [{
  options: Array.from(facets.entries())
    .filter(([value]) => typeof value === 'string' && value)
    .map(([value, count]: [string, number]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
}]

// Filter values for the User Category column that aren't category names.
const UNASSIGNED = 'unassigned'
const NEEDS_CATEGORY = 'needs-category'

// Every month has its own copy of each category, so there's one option per
// name. Categories are split into ones used recently and retired ones, below
// "Needs category" (unassigned or an unconfirmed auto guess, the same set the
// Assign Categories queue works through) and "Unassigned".
const userCategoryFilterOptions = (facets: Map<any, number>, column: Column<Transaction, any>): FilterOptionGroup[] => {
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

  const groups = groupCategoriesByRecency(
    Array.from(byName.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, { count, latest }]) => ({ option: { value: name, label: name, count }, latest }))
  )
  // Facets only see the category, not whether it was a confirmed guess, so
  // count those from the rows the other filters leave.
  const needing = column.getFacetedRowModel().rows.filter(row => needsCategory(row.original)).length
  const special = [
    ...needing ? [{ value: NEEDS_CATEGORY, label: 'Needs category', count: needing }] : [],
    ...unassigned ? [{ value: UNASSIGNED, label: 'Unassigned', count: unassigned }] : [],
  ]
  if (special.length) groups.unshift({ options: special })
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
  columnHelper.accessor(merchantLabel, {
    // Kept as merchant_name so saved column choices still apply.
    id: 'merchant_name',
    header: 'Merchant',
    cell: info => {
      const transaction = info.row.original
      const merchant = info.getValue()
      const isAmazon = transaction.merchant_name?.toLowerCase() === 'amazon'

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
    filterFn: 'equalsString',
    meta: {
      truncate: true,
      filterVariant: 'select',
      filterOptions: merchantFilterOptions,
    },
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
      if (filterValue === NEEDS_CATEGORY) return needsCategory(row.original)
      if (!data && filterValue === UNASSIGNED) return true
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
