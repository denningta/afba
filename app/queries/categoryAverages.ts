import { getPrevMonth } from "../helpers/helperFunctions"
import { CategoryAveragesResponse } from "../interfaces/categoryAverages"
import { actualAmount } from "../components/budget/amounts"
import { categoryKey } from "../components/budget/lastMonth"
import { listCategories } from "./categories"

// Average actual per category over the `count` full months before `month`.
// Reuses listCategories so "actual" means exactly what the budget table shows
// (same accounts filter, same sign handling).
export async function listCategoryAverages(month: string, count = 6): Promise<CategoryAveragesResponse> {
  const months = Array.from({ length: count }, (_, i) => getPrevMonth(month, count - i))
  const perMonth = await Promise.all(months.map(date => listCategories({ date })))

  const totals = new Map<string, { name: string, type?: string, total: number, months: number }>()
  for (const categories of perMonth) {
    for (const category of categories) {
      const key = categoryKey(category)
      const entry = totals.get(key) ?? { name: category.name?.trim() ?? '', type: category.type, total: 0, months: 0 }
      entry.total += actualAmount(category)
      entry.months += 1
      totals.set(key, entry)
    }
  }

  return {
    months,
    averages: Array.from(totals.values()).map(({ name, type, total, months }) => ({
      name,
      type,
      average: Math.round((total / months) * 100) / 100,
      monthsCounted: months,
    })),
  }
}
