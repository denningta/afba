import { Category } from "@/app/interfaces/categories";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DataTable } from "../common/DataTable";
import columns from "../transactions/transactionsColDefs";
import { Progress } from "@/components/ui/progress";

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

  let percent: number = 0
  if (category.budget && category.spent) percent = Math.round(((Math.abs(category.spent)) / category.budget) * 100)

  const { deleteRecord } = useCategories({ date: currentDate })

  const handleDeleteCategory = async () => {
    await deleteRecord(category)
  }

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
            onSelect={() => setViewTransactionsDialogOpen(true)}
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


      {typeof document !== 'undefined' && createPortal(
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
        </Dialog>,
        document.body
      )}

      {typeof document !== 'undefined' && createPortal(
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
              columns={columns.filter((colDef) => !colDef.id?.includes('userCategory'))}
              data={category.transactions ?? []}
            />
          </DialogContent>
        </Dialog>,
        document.body

      )}

    </>
  )

  // return (
  //   <div className="">
  //     <TableActionButton>
  //       <div
  //         className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
  //         onClick={handleUpdateCategory}
  //       >
  //         <RiEditFill />
  //         Edit
  //       </div>
  //       <div
  //         className="flex items-center space-x-2 cursor-pointer p-3 hover:bg-white hover:bg-opacity-10"
  //         onClick={handleDeleteCategory}
  //       >
  //         <RiDeleteBinFill />
  //         Delete
  //       </div>
  //     </TableActionButton>
  //
  //   </div>
  // )
  //
}
