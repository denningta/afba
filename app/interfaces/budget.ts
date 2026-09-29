import { Category } from "./categories"
import Transaction from "./transaction"

// One month's budget with its categories and transactions.
export interface BudgetOverview {
  _id: string
  date: string
  totalBudget: number
  totalSpent: number
  categories: Category[]
  transactions: Transaction[]
}
