'use client'

import transactionColDefs from "./transactionsColDefs"
import TransactionForm from "./TransactionForm"
import AssignCategoriesButton from "./AssignCategoriesButton"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { DataTable } from "../common/DataTable/DataTable"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useMemo } from "react"
import PageHeader from "../common/PageHeader"

// Everything not listed stays visible (date, merchant, description, account
// type, user category, amount, and the select/actions columns).
const DEFAULT_COLUMN_VISIBILITY = {
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
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Use this form to add a transaction to the table.</DialogDescription>
                <TransactionForm onSubmit={handleAddTransaction} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <DataTable
        data={stableData ?? []}
        columns={columns}
        columnVisibilityStorageKey="afba:transactions-columns"
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      />
    </div>
  )
}
