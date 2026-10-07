'use client'

import transactionColDefs from "./transactionsColDefs"
import TransactionForm, { TransactionFormValues } from "./TransactionForm"
import AssignCategoriesButton from "./AssignCategoriesButton"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { DataTable } from "../common/DataTable/DataTable"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import Transaction, { needsCategory } from "@/app/interfaces/transaction"
import DeleteTransactionsDialog from "./DeleteTransactionsDialog"
import PageHeader from "../common/PageHeader"
import { EmptyState } from "../common/StateMessage"
import Link from "next/link"
import { toast } from "sonner"

// Everything not listed stays visible (date, merchant, description, account
// type, user category, amount, and the select/actions columns).
export const DEFAULT_TRANSACTION_COLUMN_VISIBILITY = {
  month: false,
  account: false,
  personal_finance_category: false,
  pending: false,
}

// Keeps the selection on the same rows when others are deleted.
const getRowId = (transaction: Transaction) => String(transaction._id)

interface TransactionsTableProps {
  searchParams?: TransactionsFilter
}

export default function TransactionsTable({
  searchParams,
}: TransactionsTableProps) {

  const columns = useMemo(() => transactionColDefs, [])

  const {
    data,
    error,
    isLoading,
    mutate,
    createTransaction,
    setCategories,
  } = useTransactions(searchParams ?? {})

  const stableData = useMemo(() => data ?? [], [data])
  const [deleting, setDeleting] = useState<{ rows: Transaction[], clearSelection: () => void } | null>(null)

  const [adding, setAdding] = useState(false)

  // Accepts the auto-assigned category on each selected row that has one
  // waiting for review; other selected rows are left as they are.
  const confirmSelected = async (rows: Transaction[], clearSelection: () => void) => {
    const guesses = rows.filter(t => t.userCategory && needsCategory(t))
    if (!await setCategories(guesses, undefined, { confirm: true })) return
    toast.success(`Confirmed ${guesses.length} categor${guesses.length === 1 ? 'y' : 'ies'}.`)
    clearSelection()
  }

  const handleAddTransaction = async ({ name, amount, date, category }: TransactionFormValues) => {
    if (!await createTransaction({ name, amount, date, userCategory: category })) return "Couldn't add the transaction."
    toast.success(`Added ${name}.`)
    setAdding(false)
    return null
  }


  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <>
            <AssignCategoriesButton />
            <Dialog open={adding} onOpenChange={setAdding}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon />
                  Add transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add transaction</DialogTitle>
                  <DialogDescription>Record a transaction by hand, e.g. cash spending.</DialogDescription>
                </DialogHeader>
                {/* Mounted only while open, so each add starts with a blank form. */}
                {adding && <TransactionForm onSubmit={handleAddTransaction} />}
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <DataTable
        data={stableData ?? []}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        emptyState={
          <EmptyState
            title="No transactions yet"
            description="Link a bank account to sync transactions, or import them from a CSV file."
            action={
              <div className="flex gap-2">
                <Button variant="outline" asChild><Link href="/connect">Link an account</Link></Button>
                <Button variant="outline" asChild><Link href="/upload">Import CSV</Link></Button>
              </div>
            }
          />
        }
        columnVisibilityStorageKey="afba:transactions-columns"
        defaultColumnVisibility={DEFAULT_TRANSACTION_COLUMN_VISIBILITY}
        getRowId={getRowId}
        selectionActions={(rows, clearSelection) => {
          const guesses = rows.filter(t => t.userCategory && needsCategory(t)).length
          return (
            <>
              {guesses > 0 &&
                <Button variant="outline" onClick={() => confirmSelected(rows, clearSelection)}
                  title="Accept the auto-assigned category on the selected transactions">
                  <CheckIcon />
                  Confirm {guesses}
                </Button>
              }
              <Button variant="outline" className="text-destructive" onClick={() => setDeleting({ rows, clearSelection })}>
                <Trash2Icon />
                Delete {rows.length}
              </Button>
            </>
          )
        }}
      />
      <DeleteTransactionsDialog
        transactions={deleting?.rows ?? []}
        onOpenChange={open => { if (!open) setDeleting(null) }}
        onDeleted={() => deleting?.clearSelection()}
      />
    </div>
  )
}
