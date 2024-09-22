import { Category } from "@/app/interfaces/categories"

export default function getBudgetKpis(data: Category[] | undefined) {

  const budget = data ? data.reduce((acc, curr) => {
    const { budget, type } = curr
    if (type === undefined || type === 'deduction') {
      return acc + (budget ?? 0)
    } else {
      return acc + 0
    }
  }, 0) : 0

  const totalSpent = data ? data.reduce((acc, curr) => {
    const { spent, type } = curr
    if (type === undefined || type === 'deduction') {
      return acc + (spent ?? 0)
    } else {
      return acc + 0
    }
  }, 0) : 0

  const plannedIncome = data ? data.reduce((acc, curr) => {
    const { budget, type } = curr
    if (type === 'income') {
      return acc + (budget ?? 0)
    } else {
      return acc + 0
    }
  }, 0) : 0

  const actualIncome = data ? data.reduce((acc, curr) => {
    const { spent, type } = curr
    if (type === 'income') {
      return acc + (spent ?? 0)

    } else {
      return acc + 0
    }
  }, 0) : 0


  return {
    plannedIncome: {
      name: 'Planned Income',
      value: plannedIncome
    },
    plannedBudget: {
      name: 'budget',
      value: budget
    },
    plannedDiff: {
      name: 'Budget Difference',
      value: plannedIncome - budget
    },
    actualIncome: {
      name: 'Actual Income',
      value: actualIncome
    },
    actualSpent: {
      name: 'Spending',
      value: totalSpent
    },
    actualDiff: {
      name: 'Spending Difference',
      value: actualIncome + totalSpent
    }
  }
}

