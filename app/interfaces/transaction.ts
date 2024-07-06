import { ObjectId } from "mongodb"
import { Category } from "./categories"

type Transaction = {
  _id?: ObjectId
  date?: Date
  description?: string
  originalDescription?: string
  category?: string
  userCategoryId?: string
  userCategory?: Category
  status?: string
  amount?: number
}

export default Transaction
