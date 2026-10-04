import { Document } from "mongodb";
import { transactions } from "@/app/lib/mongodb";
import Transaction from "../interfaces/transaction";
import { accountJoinStages, getBudgetAccountMatch } from "./accounts";

export interface TransactionsFilter {
  userCategoryId?: string
  // 'true' when present - query params arrive from the URL as strings.
  needsCategory?: string
  // 'true' to leave out accounts excluded from the budget, so a category's
  // list adds up to its Actual on the budget page.
  budgetOnly?: string
}

// Transactions still waiting on the user: no category yet, or one the
// auto-categorizer guessed that nobody has confirmed. Shared by the list and
// the count so the badge always agrees with the review queue.
const NEEDS_CATEGORY_MATCH = {
  $match: {
    $or: [
      { userCategory: { $exists: false } },
      { $and: [{ categorySource: 'auto' }, { categoryConfirmed: { $ne: true } }] }
    ]
  }
}

// How many transactions match the same filters as listTransactions, without
// shipping every record to the browser just to count it.
export async function countTransactions(searchParams: URLSearchParams) {
  const { userCategoryId, needsCategory, budgetOnly }: TransactionsFilter = Object.fromEntries(searchParams)

  const query: any[] = [
    ...budgetOnly === 'true' ? await getBudgetAccountMatch() : [],
    ...needsCategory === 'true' ? [NEEDS_CATEGORY_MATCH] : [],
    ...userCategoryId ? [{ $match: { "userCategory._id": userCategoryId } }] : [],
    { $count: 'count' },
  ]

  const [res] = await transactions.aggregate<{ count: number }>(query).toArray()
  return res?.count ?? 0
}

export async function listTransactions(searchParams: URLSearchParams) {
  const {
    userCategoryId,
    needsCategory,
    budgetOnly
  }: TransactionsFilter = Object.fromEntries(searchParams)

  const query: any[] = [
    {
      $set: {
        _id: {
          $toString: "$_id"
        }
      }
    },
    {
      $addFields: {
        isoDate: {
          $dateFromString: {
            dateString: "$date"
          }
        }
      }
    },
    {
      $set: {
        date: {
          $dateToString: {
            date: "$isoDate",
            format: "%m/%d/%Y"
          }
        }
      }
    },
    {
      $addFields: {
        month: {
          $dateToString: {
            date: "$isoDate",
            format: "%m-%Y"
          }
        }
      }
    },
    ...accountJoinStages,
    {
      $sort:
      {
        isoDate: -1
      }
    }
  ]

  if (userCategoryId) query.unshift(
    {
      $match: {
        "userCategory._id": userCategoryId
      }
    },
  )

  if (needsCategory === 'true') query.unshift(NEEDS_CATEGORY_MATCH)

  if (budgetOnly === 'true') query.unshift(...await getBudgetAccountMatch())

  const res = await transactions
    .aggregate<Transaction>(query).toArray()

  return res
}


export interface TransactionSearch {
  from?: string // YYYY-MM-DD, inclusive
  to?: string // YYYY-MM-DD, inclusive
  // Case-insensitive substring of the category name; 'uncategorized' finds those with none.
  category?: string
  // Case-insensitive substring of the merchant or description.
  merchant?: string
  // YYYY-MM: only transactions assigned to that month's categories, which is
  // how the budget counts them (by category month, not transaction date).
  budgetMonth?: string
  minAmount?: number
  maxAmount?: number
  limit?: number
}

export interface TransactionSearchResult {
  count: number
  // Plaid's sign convention: positive is money out, negative is money in.
  total: number
  transactions: {
    date: string
    merchant: string
    amount: number
    category: string | null
    account: string | null
    pending?: boolean
  }[]
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Filtered transactions from budget accounts, newest first, with the count and
// total of everything matched (not just the rows returned). Used by the AI
// assistant, so results are compact and capped.
export async function searchTransactions(search: TransactionSearch): Promise<TransactionSearchResult> {
  const limit = Math.min(Math.max(search.limit ?? 50, 1), 200)
  const match: Document[] = []

  if (search.category) {
    match.push(search.category.trim().toLowerCase() === 'uncategorized'
      ? { $match: { userCategory: { $exists: false } } }
      : { $match: { 'userCategory.name': { $regex: escapeRegex(search.category.trim()), $options: 'i' } } })
  }
  if (search.budgetMonth) {
    match.push({ $match: { 'userCategory.date': search.budgetMonth } })
  }
  if (search.merchant) {
    const pattern = { $regex: escapeRegex(search.merchant.trim()), $options: 'i' }
    match.push({ $match: { $or: [{ merchant_name: pattern }, { name: pattern }] } })
  }
  if (search.minAmount != null || search.maxAmount != null) {
    match.push({
      $match: {
        amount: {
          ...search.minAmount != null ? { $gte: search.minAmount } : {},
          ...search.maxAmount != null ? { $lte: search.maxAmount } : {},
        }
      }
    })
  }

  // Dates are stored as text in more than one format, so compare parsed dates.
  const dateBounds: Document = {}
  if (search.from) dateBounds.$gte = new Date(`${search.from}T00:00:00Z`)
  if (search.to) dateBounds.$lte = new Date(`${search.to}T23:59:59Z`)

  const [res] = await transactions.aggregate<{
    summary: { count: number, total: number }[]
    items: TransactionSearchResult['transactions']
  }>([
    ...await getBudgetAccountMatch(),
    ...match,
    { $addFields: { _isoDate: { $dateFromString: { dateString: '$date', onError: null, onNull: null } } } },
    ...Object.keys(dateBounds).length ? [{ $match: { _isoDate: dateBounds } }] : [],
    {
      $facet: {
        summary: [{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }],
        items: [
          { $sort: { _isoDate: -1 } },
          { $limit: limit },
          ...accountJoinStages,
          {
            $project: {
              _id: 0,
              date: { $dateToString: { date: '$_isoDate', format: '%Y-%m-%d' } },
              merchant: { $ifNull: ['$merchant_name', '$name'] },
              amount: 1,
              category: { $ifNull: ['$userCategory.name', null] },
              account: { $ifNull: ['$account.name', null] },
              pending: 1,
            }
          },
        ],
      }
    },
  ]).toArray()

  const summary = res?.summary[0]
  return {
    count: summary?.count ?? 0,
    total: Math.round((summary?.total ?? 0) * 100) / 100,
    transactions: res?.items ?? [],
  }
}
