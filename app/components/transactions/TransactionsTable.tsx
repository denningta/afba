'use client'

import Table from "../Table"
import columns from "./transactionsColDefs"
import { Card } from "@tremor/react"
import TableActions from "../common/TableActions"
import { useConfirmationDialog } from "../common/Dialog"
import TransactionForm from "./TransactionForm"
import useTransactions from "@/app/hooks/useTransactions"
import { Row } from "@tanstack/react-table"
import Transaction from "@/app/interfaces/transaction"
import { TransactionsFilter } from "@/app/queries/transactions"


interface TransactionsTableProps {
  searchParams: TransactionsFilter
}

export default function TransactionsTable({ searchParams }: TransactionsTableProps) {

  const {
    data,
    upsertRecord,
  } = useTransactions(searchParams)
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

  const handleUpdateTransaction = async (row: Row<Transaction>) => {
    await dialog.getConfirmation({
      title: <div>
        <div>{row.original.description}</div>
        <div className={row.original.amount && row.original.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}>
          ${row.original.amount}
        </div>
      </div>,
      showActionButtons: false,
      content: <TransactionForm
        initialValues={row.original}
        onSubmit={async (values) => {
          await upsertRecord(values)
          dialog.closeDialog()
        }}
        onClose={() => dialog.closeDialog()}
      />
    })
  }


  return (
    <Card className="h-dvh">
      <TableActions
        onAdd={handleAddTransaction}
      />

      <Table
        data={data ?? []}
        columns={columns}
        initialState={{
          columnVisibility: {
            originalDescription: false,
            status: false
          },
          pagination: {
            pageSize: 25,
            pageIndex: 0
          }
        }}
      />
    </Card>
  )
}
