import { transactions } from "@/app/lib/mongodb";
import { Balance } from "../interfaces/balance";

export async function listBalance(accountId: string) {
  const query = [
    {
      $match: {
        accountId: accountId
      }
    },
    {
      $sort: {
        date: 1
      }
    },
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
      $group: {
        _id: "$date",
        balance: {
          $last: "$isoAccountBalance"
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        balance: 1
      }
    },
    {
      $sort: {
        date: 1
      }
    }
  ]

  const res = await transactions
    .aggregate<Balance>(query).toArray()

  return res
}
