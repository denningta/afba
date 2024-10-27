'use client'

import columns from "./transactionsColDefs"
import TransactionForm from "./TransactionForm"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { DataTable } from "../common/DataTable"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TransactionsTableProps {
  searchParams?: TransactionsFilter
}

export default function TransactionsTable({
  searchParams,
}: TransactionsTableProps) {

  const {
    data,
  } = useTransactions(searchParams ?? {})
  const handleAddTransaction = async () => {
  }

  return (
    <div>

      <div className="flex items-center space-x-6 mb-4">
        <div className="grow"></div>
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
        data={data ?? []}
        columns={columns}
      />

      {/* <Table */}
      {/*   data={data ?? []} */}
      {/*   columns={columns} */}
      {/*   onLoad={handleLoad} */}
      {/*   initialState={{ */}
      {/*     columnVisibility: { */}
      {/*       originalDescription: false, */}
      {/*       status: false */}
      {/*     }, */}
      {/*     pagination: { */}
      {/*       pageSize: 100, */}
      {/*       pageIndex: 0 */}
      {/*     }, */}
      {/*     sorting: [ */}
      {/*       { id: 'date', desc: true } */}
      {/*     ] */}
      {/*   }} */}
      {/* /> */}
      {/* <SnackbarProvider /> */}
    </div>
  )
}
