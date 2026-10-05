'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Transaction from "@/app/interfaces/transaction"
import useDeleteTransactions, { describeTransactions } from "@/app/hooks/useDeleteTransactions"

interface DeleteTransactionsDialogProps {
  // The transactions to delete; the dialog is open while there are any.
  transactions: Transaction[]
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export default function DeleteTransactionsDialog({ transactions, onOpenChange, onDeleted }: DeleteTransactionsDialogProps) {
  const deleteTransactions = useDeleteTransactions()
  const [deleting, setDeleting] = useState(false)
  const single = transactions.length === 1

  const confirm = async () => {
    setDeleting(true)
    const deleted = await deleteTransactions(transactions)
    setDeleting(false)
    if (!deleted) return
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <Dialog open={transactions.length > 0} onOpenChange={next => { if (!deleting) onOpenChange(next) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {describeTransactions(transactions)}?</DialogTitle>
          <DialogDescription>
            {single ? 'It' : 'They'}&apos;ll be removed from your budget, spending, and forecast. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={deleting} onClick={confirm}>
            {deleting ? 'Deleting…' : single ? 'Delete transaction' : `Delete ${transactions.length} transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
