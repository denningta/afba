import { ObjectId } from "mongodb"
import { Category } from "./categories"
import { Transaction as PlaidTransaction } from 'plaid'
import { Account } from "./account"

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
  // Joined from the accounts collection by listTransactions; absent elsewhere.
  account?: Pick<Account, 'name' | 'mask' | 'type' | 'subtype'>
}

// Still waiting on the user: no category yet, or one the auto-categorizer
// guessed that nobody has confirmed. Client-side twin of NEEDS_CATEGORY_MATCH
// in app/queries/transactions.ts; keep the two in step.
export const needsCategory = (t: Transaction) =>
  !t.userCategory || (t.categorySource === 'auto' && !t.categoryConfirmed)

