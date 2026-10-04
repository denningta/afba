// A category's actual per month, matched across months by name. Income is
// what came in (positive), like the budget's Actual column.
export interface CategorySpendingSeries {
  name: string
  type?: string
  // One value per entry in `months`; 0 where the category didn't exist.
  totals: number[]
  // That month's budget for the category; null where it didn't exist.
  budgets: (number | null)[]
  // The most recent month (YYYY-MM) in the window the category existed in.
  latest: string
}

export interface CategorySpendingResponse {
  // Oldest first, as YYYY-MM.
  months: string[]
  categories: CategorySpendingSeries[]
}
