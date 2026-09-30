import type { Metadata } from "next"
import { format } from "date-fns"
import { ObjectId } from "mongodb"
import CategoryTransactions from "@/app/components/budget/CategoryTransactions"
import { YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { categories } from "@/app/lib/mongodb"

interface CategoryPageProps {
  params: Promise<{ date: string, categoryId: string }>
}

// "Groceries · September 2026" in the browser tab.
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { date, categoryId } = await params
  try {
    const category = ObjectId.isValid(categoryId)
      ? await categories.findOne({ _id: new ObjectId(categoryId) }, { projection: { name: 1 } })
      : null
    return { title: `${category?.name ?? 'Category'} · ${format(YYYYMMToDate(date), "MMMM yyyy")}` }
  } catch {
    return { title: "Category" }
  }
}

export default async function CategoryTransactionsPage({ params }: CategoryPageProps) {
  const { date, categoryId } = await params

  return <CategoryTransactions date={date} categoryId={categoryId} />
}
