import { ObjectId } from "mongodb"
import { Category } from "./categories"
import { Transaction as PlaidTransaction } from 'plaid'

export default interface Transaction extends PlaidTransaction {
  _id?: ObjectId
  userCategoryId?: string
  userCategory?: Category
  status?: string
  month?: string
  // Provenance of userCategory: set by hand, or guessed by the auto-categorizer.
  categorySource?: 'manual' | 'auto'
  // Auto-assigned categories start unconfirmed until the user reviews them;
  // manual assignments are always immediately confirmed.
  categoryConfirmed?: boolean
  // The ratio (0-1) that triggered an auto-assignment, kept for debugging/analytics.
  categoryConfidence?: number
  // The specific Amazon order URL the user saved after manually finding it once.
  amazonOrderUrl?: string
}

