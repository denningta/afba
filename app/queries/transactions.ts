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

