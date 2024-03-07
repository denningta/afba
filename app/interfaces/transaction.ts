import { ObjectId } from "mongodb"

type Transaction = {
  _id?: ObjectId
  date?: Date
  description?: string
  originalDescription?: string
  category?: string
  userCategory?: string
  status?: string
  amount?: number
}

export default Transaction
