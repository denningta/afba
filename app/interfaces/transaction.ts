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
  // The user's own name for the transaction. Kept apart from Plaid's name and
  // merchant_name, which a sync overwrites.
  displayName?: string
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


// Bank transactions carry Plaid's transaction_id; ones added by hand don't.
export const isManualTransaction = (t: { transaction_id?: string | null }) => !t.transaction_id

// The name to show: the user's own, else the merchant Plaid identified, else
// the bank's description (e.g. transfers, imports).
export const transactionLabel = (t: { displayName?: string | null, merchant_name?: string | null, name?: string | null }) =>
  t.displayName || t.merchant_name || t.name || ''

// Stored transaction dates are YYYY-MM-DD.
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
