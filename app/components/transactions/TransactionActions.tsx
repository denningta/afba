import MenuItem from '@mui/joy/MenuItem'
import { RiDeleteBinFill, RiEditFill } from "@remixicon/react";
import { Icon } from "@tremor/react";
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
  const { upsertRecord, deleteRecord, mutate } = useTransactions()
  const dialog = useConfirmationDialog()

  const handleUpdateCategory = async () => {
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

  const handleDeleteCategory = async () => {
    await deleteRecord(transaction)
  }

  return (
    <div className="">
      <TableActionButton>
        <div
          className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
          onClick={handleUpdateCategory}
        >
          <RiEditFill />
          Edit
        </div>
        <div
          className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
          onClick={handleDeleteCategory}
        >
          <RiDeleteBinFill />
          Delete
        </div>
      </TableActionButton>

    </div>
  )

}
