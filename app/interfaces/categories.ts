import Transaction from "./transaction"

export interface Category {
  date: Date
  name: string
  transactions: Transaction[]
  budget: number
}
