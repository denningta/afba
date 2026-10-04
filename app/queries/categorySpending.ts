import { getPrevMonth } from "../helpers/helperFunctions"
import { CategorySpendingResponse, CategorySpendingSeries } from "../interfaces/categorySpending"
import { actualAmount } from "../components/budget/amounts"
import { categoryKey } from "../components/budget/lastMonth"
import { listCategories } from "./categories"

// Actual per category for the `count` months ending with `endMonth`. Reuses
// listCategories so each month matches the budget table for that month (same
// accounts filter, same sign handling).
export async function listCategorySpending(endMonth: string, count = 12): Promise<CategorySpendingResponse> {
  const months = Array.from({ length: count }, (_, i) => getPrevMonth(endMonth, count - 1 - i))
  const perMonth = await Promise.all(months.map(date => listCategories({ date })))

  const series = new Map<string, CategorySpendingSeries>()
  perMonth.forEach((categories, monthIndex) => {
    for (const category of categories) {
      const key = categoryKey(category)
      if (!key) continue
      const entry = series.get(key) ?? {
        name: category.name!.trim(), type: category.type, totals: months.map(() => 0), budgets: months.map(() => null), latest: '',
      }
      entry.totals[monthIndex] += Math.round(actualAmount(category) * 100) / 100
      entry.budgets[monthIndex] = (entry.budgets[monthIndex] ?? 0) + (category.budget ?? 0)
      // Months are oldest first, so the last one seen is the latest.
      entry.latest = months[monthIndex]
      series.set(key, entry)
    }
  })

  return {
    months,
    categories: Array.from(series.values()).sort((a, b) => a.name.localeCompare(b.name)),
  }
}
