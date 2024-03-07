'use client'

import { Card } from "@tremor/react";
import Table from "../Table";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import TableActions from "../common/TableActions";


export default function CategoriesTable() {
  const dialog = useConfirmationDialog()

  const {
    upsertRecord,
    data
  } = useCategories()

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
            await upsertRecord(value)
            dialog.closeDialog()
          }}
          onClose={() => dialog.closeDialog()}
        />,
      showActionButtons: false
    })
  }

  return (
    <Card>

      <TableActions
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategories}
      />

      <Table
        data={data ?? []}
        columns={categoryColumns}
      />

      <SnackbarProvider />
    </Card>
  )

}
