import type { Metadata } from "next"
import { format } from "date-fns"
import CategoriesTable from "@/app/components/budget/CategoriesTable"
import { YYYYMMToDate } from "@/app/helpers/helperFunctions"

// "Budget · September 2026" in the browser tab.
export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  try {
    return { title: `Budget · ${format(YYYYMMToDate(date), "MMMM yyyy")}` }
  } catch {
    return { title: "Budget" }
  }
}

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
