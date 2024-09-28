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

interface EditCategoryProps {
  category: Category
}

export default function CategoryActions({
  category
}: EditCategoryProps) {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()
  const [dialogOpen, setDialogOpen] = useState(false)

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
          <DropdownMenuItem>View transactions</DropdownMenuItem>
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
