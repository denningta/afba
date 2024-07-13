import CategoriesTable from "@/app/components/budget/CategoriesTable"
import { listCategories } from "@/app/queries/categories"

export interface BudgetByDateProps {
  params: {
    date: string
  }
}

export default async function BudgetByDate({ params }: BudgetByDateProps) {
  const data = await listCategories({ date: params.date })

  return (
    <div>
      <CategoriesTable data={data} />
    </div>

  )

}
