import { useMemo } from "react"
import { Category } from "@/app/interfaces/categories"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { actualAmount } from "./amounts"

// Each month has its own copy of every category, so months are matched by name.
export const categoryKey = (category: { name?: string }) => (category.name ?? '').trim().toLowerCase()

export interface LastMonthComparison {
  // Last month's category for a name, if there was one.
  get: (category: Category) => Category | undefined
  // Last month's categories that this month doesn't have yet.
  missing: Category[]
}

export function useLastMonthComparison(current: Category[] | undefined, previous: Category[] | undefined): LastMonthComparison {
  return useMemo(() => {
    const byName = new Map((previous ?? []).map(category => [categoryKey(category), category]))
    const currentNames = new Set((current ?? []).map(categoryKey))
    return {
      get: (category: Category) => byName.get(categoryKey(category)),
      missing: (previous ?? []).filter(category => !currentNames.has(categoryKey(category))),
    }
  }, [current, previous])
}

// How a month ended for a category, from the category's point of view:
// positive is good (under budget, or more income than planned).
export function result(category: Category) {
  const budget = category.budget ?? 0
  const actual = actualAmount(category)
  const amount = category.type === 'income' ? actual - budget : budget - actual
  const income = category.type === 'income'
  const label = amount === 0
    ? 'On budget'
    : `${toCurrency(Math.abs(amount))} ${amount > 0 ? (income ? 'extra' : 'left') : (income ? 'short' : 'over')}`
  return { amount, label }
}

// A budget suggested by an actual or an average: whole dollars, rounded up so
// it would have covered it. Negative (money came back in) suggests nothing.
export const budgetFromAmount = (amount: number) => Math.max(0, Math.ceil(amount))
export const budgetFromActual = (category: Category) => budgetFromAmount(actualAmount(category))
