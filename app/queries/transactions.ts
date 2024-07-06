import { transactions } from "@/app/lib/mongodb";
import Transaction from "../interfaces/transaction";

export async function listTransactions() {
  const res = await transactions.aggregate<Transaction>([
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
    }
  ]).toArray()


  return res
}
