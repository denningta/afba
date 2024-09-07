'use client'

import Table from "../Table"
import columns from "./transactionsColDefs"
import { Card } from "@tremor/react"
import TableActions from "../common/TableActions"
import { Table as TanstackTable } from "@tanstack/react-table"
import { useConfirmationDialog } from "../common/Dialog"
import TransactionForm from "./TransactionForm"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { SnackbarProvider } from "notistack"
import Transaction from "@/app/interfaces/transaction"

interface TransactionsTableProps {
  searchParams?: TransactionsFilter
}

export default function TransactionsTable({
  searchParams,
}: TransactionsTableProps) {

  const {
    data,
    upsertRecord,
  } = useTransactions(searchParams ?? {})


  const dialog = useConfirmationDialog()

  const handleAddTransaction = async () => {
    await dialog.getConfirmation({
      title: 'Add Transaction',
      content: <TransactionForm
        onSubmit={async (value) => {
          await upsertRecord(value)
          dialog.closeDialog()
        }}
      />,
      showActionButtons: false
    })
  }

  const handleLoad = (table: TanstackTable<Transaction>) => {
    return table
  }

  return (
    <Card>
      <TableActions
        onAdd={handleAddTransaction}
      />

      <Table
        data={data ?? []}
        columns={columns}
        onLoad={handleLoad}
        initialState={{
          columnVisibility: {
            originalDescription: false,
            status: false
          },
          pagination: {
            pageSize: 100,
            pageIndex: 0
          },
          sorting: [
            { id: 'date', desc: true }
          ]
        }}
      />
      <SnackbarProvider />
    </Card>
  )
}
