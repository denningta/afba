export interface BreakdownTransaction {
  _id: string
  date: string
  amount: number
  name?: string
  merchant_name?: string | null
  logo_url?: string | null
  account?: { name: string, mask?: string | null }
  categoryName?: string
  categoryDate?: string
}

export interface BreakdownGroup {
  count: number
  totalIn: number // money in, as a positive number
  totalOut: number
  transactions: BreakdownTransaction[]
}

// Everything dated in `month` that the month's KPIs leave out, and why.
export interface BudgetBreakdown {
  month: string
  // No category yet: counts toward nothing until assigned.
  uncategorized: BreakdownGroup
  // In accounts switched off with "Include in budget".
  excludedAccounts: BreakdownGroup
  // Assigned to this month's transfer categories, which KPIs skip.
  transfers: BreakdownGroup
  // Dated this month but assigned to another month's category, so they count there.
  otherMonth: BreakdownGroup
}
