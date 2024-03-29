import { Category } from "@/app/interfaces/categories";
import { RiDeleteBinFill, RiEditFill } from "@remixicon/react";
import { Icon } from "@tremor/react";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import TableActionButton from "../common/TableActionButton";

interface EditCategoryProps {
  category: Category
}

export default function CategoryActions({
  category
}: EditCategoryProps) {
  const { upsertRecord, deleteRecord } = useCategories()
  const dialog = useConfirmationDialog()

  const handleUpdateCategory = async () => {
    await dialog.getConfirmation({
      title: 'Update Category',
      showActionButtons: false,
      content: <CategoryForm
        initialValues={category}
        onSubmit={async (values) => {
          await upsertRecord(values)
          dialog.closeDialog()
        }}
        onClose={() => dialog.closeDialog()}
      />
    })
  }

  const handleDeleteCategory = async () => {
    await deleteRecord(category)
  }

  return (
    <div className="">
      <TableActionButton>
        <div className="flex items-center space-x-2" onClick={handleUpdateCategory}>
          <Icon icon={RiEditFill} color="neutral" />
          Edit
        </div>
        <div className="flex items-center space-x-2" onClick={handleDeleteCategory}>
          <Icon icon={RiDeleteBinFill} color="neutral" />
          Delete
        </div>
      </TableActionButton>

    </div>
  )

}
