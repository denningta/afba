import { transactions } from "@/app/lib/mongodb";
import Transaction from "../interfaces/transaction";

export async function listTransactions() {
  const res = await transactions.aggregate<Transaction>([
    {
      $lookup: {
        from: "categories",
        localField: "userCategory",
        foreignField: "_id",
        as: "userCategoryArray",
      },
    },
    {
      $set: {
        userCategory: {
          $first: "$userCategoryArray",
        },
      },
    },
    {
      $unset: ["userCategoryArray"],
    },
    {
      $addFields:
      {
        date: {
          $dateFromString: {
            dateString: "$date",
          },
        },
      },
    },
    {
      $addFields:
      {
        date: {
          $dateToString: {
            date: "$date",
            format: "%m/%d/%Y",
          },
        },
      },
    },
  ]).toArray()


  return res
}
