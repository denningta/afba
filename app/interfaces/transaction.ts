import { ObjectId } from "mongodb"
import { Category } from "./categories"
import { Transaction as PlaidTransaction } from 'plaid'

export default interface Transaction extends PlaidTransaction {
  _id?: ObjectId
  userCategoryId?: string
  userCategory?: Category
  status?: string
  month?: string
}

