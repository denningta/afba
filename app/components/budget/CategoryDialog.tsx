import { Category } from "@/app/interfaces/categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { SquarePlus } from "lucide-react"
import BudgetCategoryForm from "./CategoryForm"
import { useState } from "react"

export interface CategoryFormProps {
  category?: Category,
  dialogOpen?: boolean,
  onOpenChange?: (open: boolean) => void
}

const CategoryDialog = ({
  category
}: CategoryFormProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SquarePlus size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Budget categories are used to group transactions.
          </DialogDescription>
        </DialogHeader>
        <BudgetCategoryForm
          category={category}
          onCancel={() => setDialogOpen(false)}
          onSubmitted={() => setDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )

}

export default CategoryDialog
