'use client'

import { Card, Icon } from "@tremor/react";
import Table from "../Table";
import { RiAddFill, RiDeleteBinFill } from "@remixicon/react";
import { useContext } from "react";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import { CategoryContext } from "@/app/context/CategoryProvider";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";


export default function CategoriesTable() {
  const { data, upsertCategory } = useContext(CategoryContext)
  const dialog = useConfirmationDialog()

  const handleDeleteCategories = async () => {
    const res = await dialog.getConfirmation({
      title: 'Delete Category',
      content: 'Are you sure you want to delete this category?'
    })
  }

  const handleAddCategory = async () => {
    await dialog.getConfirmation({
      title: 'Add Category',
      content:
        <CategoryForm
          onSubmit={async (value) => {
            await upsertCategory(value)
            dialog.closeDialog()
          }}
          onClose={() => dialog.closeDialog()}
        />,
      showActionButtons: false
    })
  }

  return (
    <Card>
      <div className="flex justify-end space-x-3">
        <Icon
          icon={RiDeleteBinFill}
          variant="solid"
          color="rose"
          tooltip="Delete"
          size="lg"
          className="cursor-pointer"
          onClick={handleDeleteCategories}
        />

        <Icon
          icon={RiAddFill}
          variant="solid"
          tooltip="Add Category"
          size="lg"
          className="cursor-pointer"
          onClick={handleAddCategory}
        />
      </div>


      <Table data={data ?? []} columns={categoryColumns} />

      <SnackbarProvider />
    </Card>
  )

}
