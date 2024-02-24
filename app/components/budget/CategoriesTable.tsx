'use client'

import { Button, Card, Dialog, DialogPanel, Divider, Icon } from "@tremor/react";
import categoryColumns from "./CategoriesColDefs";
import Table from "../Table";
import { RiAddFill, RiDeleteBinFill } from "@remixicon/react";
import { useEffect, useState } from "react";
import CategoryForm from "./CategoryForm";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from "notistack"
import { Category } from "@/app/interfaces/categories";

export default function CategoriesTable() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [data, setData] = useState<Category[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])

  const handleOpenCategoryDialog = () => {
    setAddCategoryOpen(true)
  }

  const handleAddCategory = async (value: Category) => {
    try {
      const res = await axios.post('/api/category', value)
      enqueueSnackbar('Success!', { variant: 'success' })

    } catch (error: any) {
      enqueueSnackbar('Something went wrong, please try again.', { variant: 'error' })
    }
  }

  const handleOpenDeleteDialog = () => {
    setDeleteOpen(true)
  }

  const handleDeleteCategory = async () => {

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
          onClick={handleOpenDeleteDialog}
        />

        <Icon
          icon={RiAddFill}
          variant="solid"
          tooltip="Add Category"
          size="lg"
          className="cursor-pointer"
          onClick={handleOpenCategoryDialog}
        />
      </div>

      <Dialog
        id="category"
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        static={true}
        className="x-[100]"
      >
        <DialogPanel>
          <CategoryForm
            onSubmit={(value) => handleAddCategory(value)}
            onClose={() => setAddCategoryOpen(false)}
          />
        </DialogPanel>
      </Dialog>

      <Dialog
        id="delete"
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        static={true}
        className="x-[100]"
      >
        <DialogPanel>
          <div className="text-tremor-content-strong font-extrabold text-xl">Delete Category</div>

          <Divider />

          Are you sure you want to delete the selected categories?

          <Divider />

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="rose"
              onClick={handleDeleteCategory}
            >
              Delete
            </Button>
          </div>
        </DialogPanel>
      </Dialog>

      <Table data={data} columns={categoryColumns} />

      <SnackbarProvider />
    </Card>
  )

}
