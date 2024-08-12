import CategoriesTable from "@/app/components/budget/CategoriesTable"

export interface BudgetByDateProps {
  params: {
    date: string
  }
}

export default async function BudgetByDate() {

  return (
    <div>
      <CategoriesTable />
    </div>

  )

}
