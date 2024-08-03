import { RiDeleteBinFill, RiEditFill } from "@remixicon/react";
import { useConfirmationDialog } from "../common/Dialog";
import TableActionButton from "../common/TableActionButton";
import Transaction from "@/app/interfaces/transaction";
import useTransactions from "@/app/hooks/useTransactions";
import TransactionForm from "./TransactionForm";

interface EditTransactionProps {
  transaction: Transaction
}

export default function TransactionActions({
  transaction
}: EditTransactionProps) {
  const { upsertRecord, deleteRecord } = useTransactions()
  const dialog = useConfirmationDialog()

  const handleUpdateTransaction = async () => {
    await dialog.getConfirmation({
      title: 'Update Category',
      showActionButtons: false,
      content: <TransactionForm
        initialValues={transaction}
        onSubmit={async (values) => {
          await upsertRecord(values)
          dialog.closeDialog()
        }}
        onClose={() => dialog.closeDialog()}
      />
    })
  }

  const handleDeleteTransaction = async () => {
    await deleteRecord(transaction)
  }

  return (
    <div className="">
      <TableActionButton>
        <div
          className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
          onClick={handleUpdateTransaction}
        >
          <RiEditFill />
          Edit
        </div>
        <div
          className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
          onClick={handleDeleteTransaction}
        >
          <RiDeleteBinFill />
          Delete
        </div>
      </TableActionButton>

    </div>
  )

}
