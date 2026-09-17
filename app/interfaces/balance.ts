export interface AccountBalanceMeta {
  account_id: string
  name: string
  official_name?: string | null
  mask?: string | null
  type: string
  subtype?: string | null
  institution_id?: string | null
  institutionName?: string | null
  currentBalance: number
}

export interface BalanceTransaction {
  _id: string
  date: string
  account_id: string
  name: string
  merchant_name?: string | null
  amount: number
  pending: boolean
  categoryName?: string | null
}

export interface BalanceHistoryResponse {
  dates: string[]
  accounts: AccountBalanceMeta[]
  balancesByAccount: Record<string, number[]>
  transactions: BalanceTransaction[]
}
