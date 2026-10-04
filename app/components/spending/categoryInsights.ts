import type { CategorySpendingResponse } from "@/app/interfaces/categorySpending"

// What makes a category worth a look, computed from its monthly actuals and
// budgets in the chart's window.
export interface CategoryInsight {
  name: string
  type?: string
  income: boolean
  // Months (in the window) the category existed in.
  activeMonths: number
  total: number
  average: number
  // Expenses: how much it went over budget in total, and in how many months.
  overBudget: number
  overMonths: number
  budgetedMonths: number
  // Average of the last 3 completed months vs the 3 before (null if unknown).
  trendPct: number | null
  // Coefficient of variation over completed months: 0 steady, 1+ very spiky.
  variability: number | null
  // Actuals per month, oldest first, for a sparkline.
  totals: number[]
}

const TREND_MONTHS = 3
const round2 = (value: number) => Math.round(value * 100) / 100

export function categoryInsights(data: CategorySpendingResponse, currentMonth: string): CategoryInsight[] {
  // The current month is still filling up, so it would skew trends and spikes.
  const completed = data.months.map((month, i) => ({ month, i })).filter(({ month }) => month < currentMonth)

  return data.categories.map(category => {
    const income = category.type === 'income'
    // Older responses (e.g. still in the browser's cache) have no budgets;
    // treat those as unbudgeted rather than failing the whole page.
    const budgets = category.budgets ?? []
    const totals = category.totals ?? []
    const active = data.months.map((_, i) => i).filter(i => budgets[i] != null || (totals[i] ?? 0) !== 0)
    const total = round2(active.reduce((sum, i) => sum + (totals[i] ?? 0), 0))

    let overBudget = 0
    let overMonths = 0
    let budgetedMonths = 0
    if (!income) {
      for (const i of active) {
        const budget = budgets[i]
        if (!budget || budget <= 0) continue
        budgetedMonths++
        const over = (totals[i] ?? 0) - budget
        if (over > 0.005) {
          overBudget += over
          overMonths++
        }
      }
    }

    const completedActive = completed.filter(({ i }) => active.includes(i)).map(({ i }) => totals[i] ?? 0)
    const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
    let trendPct: number | null = null
    if (completedActive.length >= TREND_MONTHS * 2) {
      const recent = avg(completedActive.slice(-TREND_MONTHS))
      const prior = avg(completedActive.slice(-TREND_MONTHS * 2, -TREND_MONTHS))
      if (prior > 1) trendPct = Math.round(((recent - prior) / prior) * 100)
    }

    let variability: number | null = null
    if (completedActive.length >= 3) {
      const mean = avg(completedActive)
      if (mean > 1) {
        const variance = avg(completedActive.map(v => (v - mean) ** 2))
        variability = Math.round((Math.sqrt(variance) / mean) * 100) / 100
      }
    }

    return {
      name: category.name,
      type: category.type,
      income,
      activeMonths: active.length,
      total,
      average: active.length ? round2(total / active.length) : 0,
      overBudget: round2(overBudget),
      overMonths,
      budgetedMonths,
      trendPct,
      variability,
      totals: data.months.map((_, i) => totals[i] ?? 0),
    }
  })
}

export type InsightSort = 'total' | 'overBudget' | 'trend' | 'variability' | 'name'

export const SORT_LABELS: Record<InsightSort, string> = {
  total: 'Biggest',
  overBudget: 'Most over budget',
  trend: 'Trending up',
  variability: 'Most variable',
  name: 'A–Z',
}

export function sortInsights(insights: CategoryInsight[], sort: InsightSort) {
  const by: Record<InsightSort, (a: CategoryInsight, b: CategoryInsight) => number> = {
    total: (a, b) => b.total - a.total,
    overBudget: (a, b) => b.overBudget - a.overBudget || b.overMonths - a.overMonths,
    trend: (a, b) => (b.trendPct ?? -Infinity) - (a.trendPct ?? -Infinity),
    variability: (a, b) => (b.variability ?? -1) - (a.variability ?? -1),
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return [...insights].sort((a, b) => by[sort](a, b) || a.name.localeCompare(b.name))
}

// One-click selections. Each picks from expense categories (or income) and
// skips ones that don't qualify, so a preset can return fewer than 3.
export interface SelectionPreset {
  id: string
  label: string
  description: string
  pick: (insights: CategoryInsight[]) => string[]
}

const PRESET_SIZE = 3
const expenses = (insights: CategoryInsight[]) => insights.filter(i => !i.income && i.total > 0)
const top = (list: CategoryInsight[], sort: InsightSort) => sortInsights(list, sort).slice(0, PRESET_SIZE).map(i => i.name)

export const SELECTION_PRESETS: SelectionPreset[] = [
  {
    id: 'biggest',
    label: 'Top 3 spending',
    description: 'Largest total spending in this window',
    pick: insights => top(expenses(insights), 'total'),
  },
  {
    id: 'over-budget',
    label: 'Top 3 over budget',
    description: 'Most money spent beyond the budget',
    pick: insights => top(expenses(insights).filter(i => i.overBudget > 0), 'overBudget'),
  },
  {
    id: 'trending-up',
    label: 'Top 3 trending up',
    description: 'Biggest rise, last 3 months vs the 3 before',
    pick: insights => top(expenses(insights).filter(i => (i.trendPct ?? 0) > 0 && i.average >= 20), 'trend'),
  },
  {
    id: 'variable',
    label: 'Most variable',
    description: 'Spikiest month to month (hardest to budget)',
    pick: insights => top(expenses(insights).filter(i => i.variability != null && i.average >= 20), 'variability'),
  },
  {
    id: 'income',
    label: 'Income',
    description: 'Every income category',
    pick: insights => sortInsights(insights.filter(i => i.income && i.total > 0), 'total').map(i => i.name),
  },
]
