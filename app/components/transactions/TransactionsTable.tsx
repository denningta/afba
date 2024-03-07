'use client'

import Table from "../Table"
import columns from "./transactionsColDefs"
import { Card } from "@tremor/react"
import useData from "@/app/hooks/useData"
import Transaction from "@/app/interfaces/transaction"
import TableActions from "../common/TableActions"
import { useConfirmationDialog } from "../common/Dialog"



export default function TransactionsTable() {
  const {
    data,
    upsertRecord,
  } = useData<Transaction>({
    endpoint: {
      listRecords: '/api/transactions',
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    }
  })
  const dialog = useConfirmationDialog()

  const handleAddTransaction = async () => {
    await dialog.getConfirmation({
      title: 'Add Category',
      content: 'test',
      showActionButtons: false
    })
  }


  return (
    <Card>
      <div className="overflow-auto">
        <TableActions
          onAdd={handleAddTransaction}
        />

        <Table data={data ?? []} columns={columns} />
      </div>
    </Card>
  )
}
