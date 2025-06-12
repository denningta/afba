import { ObjectId } from "mongodb"
import Transaction from "./transaction"

export interface Category {
  _id?: ObjectId
  date?: string
  name?: string
  transactions?: Transaction[] | undefined
  budget?: number
  type?: "deduction" | "income" | "transfer"
  spent?: number
}
