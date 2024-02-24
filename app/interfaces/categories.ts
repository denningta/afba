import { ObjectId } from "mongodb"
import Transaction from "./transaction"

export interface Category {
  _id?: ObjectId
  date?: Date
  name?: string
  transactions?: Transaction[] | undefined
  budget?: number
}
