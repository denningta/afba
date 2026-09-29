'use client'

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeftIcon, FolderInputIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCategories from "@/app/hooks/useCategories"
import useTransactions, { transactionsQueryString } from "@/app/hooks/useTransactions"
import useReassignTransactions from "@/app/hooks/useReassignTransactions"
import { YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"
import { TransactionsFilter } from "@/app/queries/transactions"
import transactionColDefs from "../transactions/transactionsColDefs"
import { DEFAULT_TRANSACTION_COLUMN_VISIBILITY } from "../transactions/TransactionsTable"
import { CategoryChangeContext } from "../transactions/UserCategoryCell"
import { CategoryPicker } from "../common/CategoryPicker"
import { DataTable } from "../common/DataTable/DataTable"
import PageHeader from "../common/PageHeader"
import { EmptyState, ErrorState } from "../common/StateMessage"
import CategoryProgressRow from "./CategoryProgressRow"

interface CategoryTransactionsProps {
  // YYYY-MM - the month the category belongs to.
  date: string
  categoryId: string
}

const getRowId = (transaction: Transaction) => String(transaction._id)

export default function CategoryTransactions({ date, categoryId }: CategoryTransactionsProps) {
  const monthLabel = format(YYYYMMToDate(date), "MMMM yyyy")
  const backLink = (
    <Button variant="outline" asChild>
      <Link href={`/budget/${date}`}><ArrowLeftIcon /> Back to budget</Link>
    </Button>
  )

  const { data: categories, isLoading: categoriesLoading, error: categoriesError, mutate: retryCategories } = useCategories({ date })
  const category = categories?.find(c => String(c._id) === categoryId)

  // Only budget accounts, so the list adds up to the category's Actual.
  const filter: TransactionsFilter = { userCategoryId: categoryId, budgetOnly: 'true' }
  const listKey = `/api/transactions${transactionsQueryString(filter)}`
  const { data, isLoading, error, mutate } = useTransactions(filter)
  const rows = useMemo(() => data ?? [], [data])

  const { reassign } = useReassignTransactions(listKey)

  // Picking the category being viewed is a no-op rather than a "move".
  const moveTo = useCallback(async (transactions: Transaction[], target: Category | undefined) => {
    if (target && String(target._id) === categoryId) return
    await reassign(transactions, target)
  }, [categoryId, reassign])

  const moveOne = useCallback(
    (transaction: Transaction, target: Category | undefined) => moveTo([transaction], target),
    [moveTo]
  )

  if (categoriesError) {
    return (
      <Card>
        <ErrorState title="Couldn't load this category" error={categoriesError} onRetry={() => retryCategories()} />
      </Card>
    )
  }

  if (!categoriesLoading && !category) {
    return (
      <Card>
        <EmptyState
          title="Category not found"
          description={`It may have been deleted from the ${monthLabel} budget.`}
          action={backLink}
        />
      </Card>
    )
  }

  const count = rows.length

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title={category?.name ?? "Loading…"}
        description={isLoading ? monthLabel : `${monthLabel} · ${count} transaction${count === 1 ? '' : 's'}`}
        actions={backLink}
      />

      <Card>
        <CardContent>
          {category ? <CategoryProgressRow category={category} /> : <Skeleton className="h-9 w-full" />}
        </CardContent>
      </Card>

      <CategoryChangeContext.Provider value={moveOne}>
        <DataTable
          data={rows}
          columns={transactionColDefs}
          getRowId={getRowId}
          isLoading={isLoading}
          error={error}
          onRetry={() => mutate()}
          columnVisibilityStorageKey="afba:category-transactions-columns"
          defaultColumnVisibility={DEFAULT_TRANSACTION_COLUMN_VISIBILITY}
          emptyState={
            <EmptyState
              title="No transactions in this category yet"
              description="Assign transactions to it from the Transactions page."
              action={
                <Button variant="outline" asChild><Link href="/transactions/assign">Assign categories</Link></Button>
              }
            />
          }
          selectionActions={(selected, clearSelection) => (
            <MoveSelectedButton
              count={selected.length}
              date={date}
              onMove={async (target) => {
                clearSelection()
                await moveTo(selected, target)
              }}
            />
          )}
        />
      </CategoryChangeContext.Provider>
    </div>
  )
}

interface MoveSelectedButtonProps {
  count: number
  // Month the picker opens on; it can be paged to other months.
  date: string
  onMove: (category: Category | undefined) => Promise<void>
}

function MoveSelectedButton({ count, date, onMove }: MoveSelectedButtonProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(date)
  const { data: options } = useCategories({ date: month })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>
          <FolderInputIcon />
          Move {count} to…
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end">
        <CategoryPicker
          options={options ?? []}
          value={undefined}
          date={month}
          autoFocus
          onMonthChange={setMonth}
          onSelectionChange={(category) => {
            setOpen(false)
            onMove(category)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
