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

  if (needsCategory === 'true') query.unshift(
    {
      $match: {
        $or: [
          { userCategory: { $exists: false } },
          { $and: [{ categorySource: 'auto' }, { categoryConfirmed: { $ne: true } }] }
        ]
      }
    },
  )

  if (budgetOnly === 'true') query.unshift(...await getBudgetAccountMatch())

  const res = await transactions
    .aggregate<Transaction>(query).toArray()

  return res
}

