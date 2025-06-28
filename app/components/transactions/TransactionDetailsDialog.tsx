import Transaction from "@/app/interfaces/transaction";
import { Dialog } from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";

export interface TransactionDetailsDialogProps {
  transaction: Transaction
}

export default function TransactionDetailsDialog({ transaction }: TransactionDetailsDialogProps) {

  return (
    <Dialog>
      <DialogTrigger>
      </DialogTrigger>
    </Dialog>

  )
}
