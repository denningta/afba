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


  const res = await transactions
    .aggregate<Transaction>(query).toArray()

  return res
}

export interface PotentialDuplicates {
  _id: {
    date: string,
    description: string,
    category: string
    amount: number
  },
  transactions: Transaction[]
}

export async function getPotentialDuplicates() {
  const query = [
    {
      $group: {
        _id: {
          date: "$date",
          description: "$description",
          category: "$category",
          amount: "$amount"
        },
        transactions: {
          $push: {
            _id: "$_id",
            date: "$date",
            description: "$description",
            originalDescription:
              "$originalDescription",
            category: "$category",
            amount: "$amount",
            status: "$status",
            month: "$month",
            userCategory: "$userCategory"
          }
        },
        count: {
          $sum: 1
        }
      }
    },
    {
      $match:
      /**
       * query: The query in MQL.
       */
      {
        count: {
          $gt: 1
        }
      }
    }
  ]

  const res = await transactions
    .aggregate<PotentialDuplicates>(query).toArray()

  return res
}
