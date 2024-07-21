import { transactions } from "@/app/lib/mongodb";
import Transaction from "../interfaces/transaction";

export interface TransactionsFilter {
  userCategoryId?: string
}

export async function listTransactions(searchParams: URLSearchParams) {
  const {
    userCategoryId
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
      $addFields:
      {
        isoDate: {
          $dateFromString: {
            dateString: "$date"
          }
        }
      }
    },
    {
      $set:
      {
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
        },
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


  const res = await transactions
    .aggregate<Transaction>(query).toArray()

  return res
}
