// Transactions without an account_id (manually added or CSV-imported) are
// grouped under this pseudo-account so they can be budgeted like any other.
export const MANUAL_ACCOUNT_ID = 'manual'

export interface Account {
  _id?: string
  account_id: string
  item_id?: string
  name: string
  official_name?: string | null
  mask?: string | null
  type: string
  subtype?: string | null
  institution_id?: string | null
  institutionName?: string | null
  currentBalance?: number | null
  includeInBudget: boolean
  updatedAt?: string
}
