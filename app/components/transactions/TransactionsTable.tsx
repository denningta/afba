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
    <div className="m-2">
      <div className="text-2xl mx-4 mb-8">Transactions</div>
      <div className="flex items-center space-x-6 mb-4">
        <div className="grow"></div>

        <AssignCategoriesButton />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusIcon />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Use this form to add a transaction to the table.</DialogDescription>
            <TransactionForm onSubmit={handleAddTransaction} />
          </DialogContent>
        </Dialog>

      </div>

      <DataTable
        data={stableData ?? []}
        columns={columns}
      />
    </div>
  )
}
