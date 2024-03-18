import { transactions } from "@/app/lib/mongodb";

export async function listTransactions() {
  const res = await transactions
    .aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'userCategory',
          foreignField: '_id',
          as: 'userCategoryArray'
        }
      },
      {
        $set: {
          userCategory: { $first: '$userCategoryArray' }
        }
      },
      {
        $unset: ['userCategoryArray']
      }
    ])
    .toArray()

  console.log(res)


  return res
}
