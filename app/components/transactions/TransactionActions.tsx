import Transaction from "@/app/interfaces/transaction";
import useTransactions from "@/app/hooks/useTransactions";
import TransactionForm from "./TransactionForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import JsonView from "@uiw/react-json-view"
import { githubDarkTheme } from "@uiw/react-json-view/githubDark"

interface EditTransactionProps {
  transaction: Transaction
}

export default function TransactionActions({
  transaction
}: EditTransactionProps) {
  const [dialogMenu, setDialogMenu] = useState<string>('none')

  const handleDialogMenu = (): JSX.Element | null => {

    console.log(dialogMenu)
    switch (dialogMenu) {
      case "view-transaction":
        return <TransactionDetailsDialog
          transaction={transaction}
          onClose={() => setDialogMenu('none')}
        />
      default:
        return null
    }
  }

  return (
    <Dialog>
      <DropdownMenu modal={false}>
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

          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={() => setDialogMenu("view-transaction")}>
              <MagnifyingGlassIcon className="mr-2" /> View Transaction Details
            </DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuItem
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {handleDialogMenu()}
    </Dialog>
  )

}


export interface TransactionDetailsDialogProps {
  transaction: Transaction
  onClose: () => void
}

function TransactionDetailsDialog({ transaction, onClose }: TransactionDetailsDialogProps) {

  return (
    <DialogContent className="max-w-fit h-5/6">
      <DialogHeader>
        <DialogTitle>View Transaction Details</DialogTitle>
        <DialogDescription>View the full details of this transaction.</DialogDescription>
      </DialogHeader>
      <div className="overflow-scroll">
        <JsonView value={transaction} style={githubDarkTheme} />
      </div>
    </DialogContent>
  )
}

export interface EditTransactionDialogProps {
  transaction: Transaction
  onClose: () => void
}

export function EditTransactionDialog({ transaction, onClose }: EditTransactionDialogProps) {
  const { upsertRecord } = useTransactions()

  const handleUpdateTransaction = async (value: Transaction) => {
    try {
      await upsertRecord({ ...transaction, ...value })

    } catch (e: any) {
      console.error(e)
    }
  }

  return (
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
  )
}
