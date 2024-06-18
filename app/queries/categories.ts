import { categories } from "@/app/lib/mongodb"
import { Document } from "mongodb"
import { BudgetOverview } from "../components/budget/BudgetOverview"

interface CategoriesQuery {
  date?: string
}

export const categoryCalculationStages: Document[] = [
  {
    $lookup: {
      from: "transactions",
      localField: "_id",
      foreignField: "userCategory",
      pipeline: [
        {
          $project: {
            date: '$date',
            description: '$description',
            amount: '$amount'
          }
        }
      ],
      as: "transactions"
    }
  },
  {
    $lookup: {
      from: "transactions",
      localField: "_id",
      foreignField: "userCategory",
      pipeline: [
        {
          $group: {
            _id: null,
            spent: {
              $sum: { $abs: "$amount" },
            },
          },
        },
      ],
      as: "spent",
    },
  },
  {
    $addFields: {
      spent: {
        $round: [{ $first: "$spent.spent" }, 2],
      },
      _id: {
        $toString: "$_id"
      }
    },
  },
]


const budgetOverviewStages: Document[] = [
  {
    $addFields: {
      date: {
        $dateFromString: {
          dateString: "$date",
        },
      },
      dateString: "$date",
    },
  },
  {
    $group: {
      _id: {
        year: {
          $year: "$date",
        },
        month: {
          $month: "$date",
        },
      },
      date: {
        $first: "$dateString",
      },
      totalBudget: {
        $sum: "$budget",
      },
      totalSpent: {
        $sum: "$spent",
      },
      categories: {
        $push: {
          name: "$name",
          budget: "$budget",
        },
      },
      transactions: {
        $push: "$transactions"
      }
    },
  },
  {
    $addFields: {
      transactions: {
        $reduce: {
          input: "$transactions",
          initialValue: [],
          in: {
            $concatArrays: ["$$value", "$$this"],
          },
        },
      },
    },
  },
]

export async function listCategories({ date }: CategoriesQuery) {
  if (date) {
    categoryCalculationStages.unshift({
      $match: { date: date }
    })
  }

  const res = await categories.aggregate(categoryCalculationStages).toArray()
  return res
}

export async function getBudgetOverview() {
  const res = await categories.aggregate<BudgetOverview>([
    ...categoryCalculationStages,
    ...budgetOverviewStages
  ]).toArray()

  return res

}
