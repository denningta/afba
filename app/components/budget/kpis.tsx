import { Category } from "@/app/interfaces/categories"

// One category's share of a KPI total.
export interface KpiContributor {
  category: Category
  amount: number
}

export interface Kpi {
  name: string
  value: number
  // The categories summed into `value`, so a breakdown can show (and
  // re-add) exactly what the card shows.
  contributors: KpiContributor[]
}

const isExpense = (c: Category) => c.type === undefined || c.type === 'deduction'
const isIncome = (c: Category) => c.type === 'income'

function sumOf(name: string, categories: Category[], amountOf: (c: Category) => number): Kpi {
  const contributors = categories.map(category => ({ category, amount: amountOf(category) }))
  return {
    name,
    value: contributors.reduce((sum, c) => sum + c.amount, 0),
    contributors,
  }
}

// The month's headline numbers. Transfer categories count toward none of them.
export default function getBudgetKpis(data: Category[] | undefined) {
  const categories = data ?? []
  const expenses = categories.filter(isExpense)
  const income = categories.filter(isIncome)

  const plannedIncome = sumOf('Planned Income', income, c => c.budget ?? 0)
  const plannedBudget = sumOf('budget', expenses, c => c.budget ?? 0)
  // Transaction amounts follow Plaid's convention (positive = money out), so
  // income sums negative. Flip it so the card reads income - spending = diff.
  const actualIncome = sumOf('Actual Income', income, c => -(c.spent ?? 0))
  const actualSpent = sumOf('Spending', expenses, c => c.spent ?? 0)

  return {
    plannedIncome,
    plannedBudget,
    plannedDiff: {
      name: 'Budget Difference',
      value: plannedIncome.value - plannedBudget.value
    },
    actualIncome,
    actualSpent,
    actualDiff: {
      name: 'Spending Difference',
      value: actualIncome.value - actualSpent.value
    }
  }
}
