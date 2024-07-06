import CategoriesTable from "@/app/components/budget/CategoriesTable"
import { listCategories } from "@/app/queries/categories"

export interface BudgetByDateProps {
  params: {
    date: string
  }
}

export default async function BudgetByDate({ params }: BudgetByDateProps) {
  console.log("params: ", params)
  const data = await listCategories({ date: params.date })
  console.log(data)

  return (
    <div>
      <CategoriesTable data={data} />
    </div>

  )

}
