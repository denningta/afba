import { Category } from "@/app/interfaces/categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SquarePlus } from "lucide-react"
import BudgetCategoryForm from "./CategoryForm"

export interface CategoryFormProps {
  category?: Category,
  dialogOpen?: boolean,
  onOpenChange?: (open: boolean) => void
}

const CategoryDialog = ({
}: CategoryFormProps) => {

  return (
    <Dialog>
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
        <BudgetCategoryForm />
      </DialogContent>
    </Dialog>
  )

}

export default CategoryDialog
