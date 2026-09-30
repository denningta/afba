// A category's average actual over recent months, matched across months by
// name. Income is what came in (positive), like the budget's Actual column.
export interface CategoryAverage {
  name: string
  type?: string
  average: number
  // Months the category existed in; the average is over these, not the window.
  monthsCounted: number
}

export interface CategoryAveragesResponse {
  // The window averaged over, oldest first, as YYYY-MM.
  months: string[]
  averages: CategoryAverage[]
}
