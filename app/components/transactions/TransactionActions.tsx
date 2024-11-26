import Transaction from "@/app/interfaces/transaction";
import useTransactions from "@/app/hooks/useTransactions";
import TransactionForm from "./TransactionForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface EditTransactionProps {
  transaction: Transaction
}

export default function TransactionActions({
  transaction
}: EditTransactionProps) {
  const { upsertRecord, deleteRecord } = useTransactions()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleUpdateTransaction = async (value: Transaction) => {
    try {
      await upsertRecord({ ...transaction, ...value })

    } catch (e: any) {
      console.error(e)
    }

    setDialogOpen(false)
  }

  const handleDeleteTransaction = async () => {
    await deleteRecord(transaction)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            tabIndex={-1}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => setDialogOpen(true)}
          >
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => handleDeleteTransaction()}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      {typeof document !== 'undefined' && createPortal(
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Make changes to this budget category.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              initialValues={transaction}
              onSubmit={(value) => handleUpdateTransaction(value)}
            />
          </DialogContent>
        </Dialog>,
        document.body
      )}

    </>
  )

}
