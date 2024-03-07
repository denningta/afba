import { Category } from "@/app/interfaces/categories";
import { RiDeleteBinFill, RiMoreFill, RiPencilFill } from "@remixicon/react";
import { Icon } from "@tremor/react";
import { useState } from "react";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";
import { Menu, MenuItem } from "@mui/material"
import useCategories from "@/app/hooks/useCategories";

interface EditCategoryProps {
  category: Category
}

export default function CategoryActions({
  category
}: EditCategoryProps) {
  const { upsertRecord, deleteRecord } = useCategories()
  const dialog = useConfirmationDialog()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)


  const handleUpdateCategory = async () => {
    setAnchorEl(null)
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

  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div className="">
      <Icon
        icon={RiMoreFill}
        color="neutral"
        className="cursor-pointer"
        onClick={handleClick}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem
          onClick={handleUpdateCategory}
        >
          <div className="flex items-center space-x-3">
            <Icon
              icon={RiPencilFill}
              color="neutral"
            />
            Edit
          </div>
        </MenuItem>

        <MenuItem
          onClick={handleDeleteCategory}
        >
          <div className="flex items-center space-x-3">
            <Icon
              icon={RiDeleteBinFill}
              color="neutral"
            />
            Delete
          </div>
        </MenuItem>
      </Menu>


      {/**/}
    </div>
  )

}
