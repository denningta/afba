"use client"

import { Category } from "@/app/interfaces/categories";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { DataTable } from "../common/DataTable";
import columns from "../transactions/transactionsColDefs";
import { Progress } from "@/components/ui/progress";
import { DotsHorizontalIcon, MagnifyingGlassIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";

interface EditCategoryProps {
  category: Category
}

export default function CategoryActions({
  category
}: EditCategoryProps) {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewTransactionsDialogOpen, setViewTransactionsDialogOpen] = useState(false)
  const [dialogMenu, setDialogMenu] = useState<string>('none')

  let percent: number = 0
  if (category.budget && category.spent) percent = Math.round(((Math.abs(category.spent)) / category.budget) * 100)

  const { deleteRecord } = useCategories({ date: currentDate })

  const handleDeleteCategory = async () => {
    await deleteRecord(category)
  }
  console.log(dialogMenu)

  const handleDialogMenu = (): JSX.Element | null => {
    switch (dialogMenu) {
      case "view-transactions":
        return <ViewTransactionsDialog category={category} />
      case "edit":
        return <EditDialog category={category} onClose={() => setDialogMenu('none')} />
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
          >
            <DotsHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>

            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={() => setDialogMenu("view-transactions")}>
                <MagnifyingGlassIcon className="mr-2" /> View Transactions
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />

            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={() => setDialogMenu("edit")}>
                <Pencil1Icon className="mr-2" /> Edit
              </DropdownMenuItem>
            </DialogTrigger>

            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={() => setDialogMenu("delete")}>
                <TrashIcon className="mr-2" /> Delete
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuGroup>

        </DropdownMenuContent>
      </DropdownMenu>
      {handleDialogMenu()}
    </Dialog>

  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              setTimeout(() => setViewTransactionsDialogOpen(true), 0)
            }}
          >
            View transactions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDialogOpen(true)}
          >
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => handleDeleteCategory()}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to this budget category.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm category={category} onSubmitted={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={viewTransactionsDialogOpen} onOpenChange={setViewTransactionsDialogOpen}>
        <DialogContent className="max-w-fit max-h-screen overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions for {category.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center space-x-4">
            <div>Budget: {category.budget}</div>
            <div>Spent: {category.spent}</div>
            <div className="grow">
              Progress: {

                <div className="flex w-full items-center space-x-2">
                  <Progress value={percent} />
                  <span className="min-w-[40px] text-xs">{percent}%</span>
                </div>
              }
            </div>
          </div>
          <DataTable
            columns={columns}
            data={category.transactions ?? []}
          />
        </DialogContent>
      </Dialog>

    </>
  )
}

interface EditDialogProps {
  category: Category
  onClose: () => void
}

function EditDialog({ category, onClose }: EditDialogProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogDescription>
          Make changes to this budget category.
        </DialogDescription>
      </DialogHeader>
      <CategoryForm category={category} onSubmitted={() => onClose()} />
    </DialogContent>
  )
}

interface ViewTransactionsDialogProps {
  category: Category
}

function ViewTransactionsDialog({ category }: ViewTransactionsDialogProps) {
  let percent: number = 0
  if (category.budget && category.spent) percent = Math.round(((Math.abs(category.spent)) / category.budget) * 100)

  return (
    <DialogContent className="max-w-fit max-h-screen overflow-auto">
      <DialogHeader>
        <DialogTitle>
          Transactions for {category.name}
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center space-x-4">
        <div>Budget: {category.budget}</div>
        <div>Spent: {category.spent}</div>
        <div className="grow">
          Progress: {

            <div className="flex w-full items-center space-x-2">
              <Progress value={percent} />
              <span className="min-w-[40px] text-xs">{percent}%</span>
            </div>
          }
        </div>
      </div>
      <DataTable
        columns={columns}
        data={category.transactions ?? []}
      />
    </DialogContent>

  )

}
