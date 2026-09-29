'use client'

import transactionColDefs from "./transactionsColDefs"
import TransactionForm from "./TransactionForm"
import AssignCategoriesButton from "./AssignCategoriesButton"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { DataTable } from "../common/DataTable/DataTable"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useMemo } from "react"
import PageHeader from "../common/PageHeader"
import { EmptyState } from "../common/StateMessage"
import Link from "next/link"

// Everything not listed stays visible (date, merchant, description, account
// type, user category, amount, and the select/actions columns).
export const DEFAULT_TRANSACTION_COLUMN_VISIBILITY = {
  month: false,
  account: false,
  personal_finance_category: false,
  pending: false,
}

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
  } = useTransactions(searchParams ?? {})

  const stableData = useMemo(() => data ?? [], [data])

  const handleAddTransaction = async () => {
  }


  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <>
            <AssignCategoriesButton />
            <Dialog>
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
                <TransactionForm onSubmit={handleAddTransaction} />
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
      />
    </div>
  )
}
