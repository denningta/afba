'use client'

import { Button, Card, Divider, Select, SelectItem } from "@tremor/react";
import Table from "../Table";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import TableActions from "../common/TableActions";
import { Category } from "@/app/interfaces/categories";
import { FormEventHandler, useState } from "react";
import CopyBudgetForm from "./CopyBudgetForm";
import axios from "axios";
import { usePathname } from "next/navigation";

interface CategoriesTableProps {
}

export default function CategoriesTable({ }: CategoriesTableProps) {
  const dialog = useConfirmationDialog()

  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const {
    data,
    upsertRecord,
    mutate
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

  const handleCopyPrevMonth = async () => {


    await dialog.getConfirmation({
      title: 'Copy Budget',
      content: <CopyBudgetForm
        onSubmit={async (month) => {
          const res = await axios.post(`/api/copyCategories/${month}`, {
            currentDate: currentDate
          })
          mutate()
          dialog.closeDialog()
        }}
      />,
      showActionButtons: false
    })
  }

  return (
    <Card className="h-dvh">
      <TableActions
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategories}
        onCopyPrevMonth={handleCopyPrevMonth}
        showCopyPrevMonth={true}
      />

      <Table
        data={data ?? []}
        columns={categoryColumns}
      />

      <SnackbarProvider />
    </Card>
  )

}


