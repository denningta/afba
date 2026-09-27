import { categories } from "@/app/lib/mongodb"
import { Document } from "mongodb"
import { BudgetOverview } from "../components/budget/BudgetOverview"
import { accountJoinStages, getBudgetAccountMatch } from "./accounts"

export interface CategoriesQuery {
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
              $sum: "$amount",
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
      _id: "$dateString",
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
  const budgetMatch = await getBudgetAccountMatch()

  const res = await categories.aggregate([
    ... !!date ? [{
      $match: {
        date: date
      }
    }] : [],
    {
      $addFields: {
        id: {
          $toString: "$_id"
        }
      }
    },
    {
      $lookup: {
        from: "transactions",
        localField: "id",
        foreignField: "userCategory._id",
        pipeline: [
          ...budgetMatch,
          {
            $project: {
              account_id: "$account_id",
              date: "$date",
              description: "$description",
              amount: "$amount",
              personal_finance_category: "$personal_finance_category.primary",
              originalDescription: "$originalDescription",
              status: "$status",
              userCategory: "$userCategory",
              merchant_name: "$merchant_name",
              name: "$name",
            }
          },
          ...accountJoinStages
        ],
        as: "transactions"
      }
    },
    {
      $lookup: {
        from: "transactions",
        localField: "id",
        foreignField: "userCategory._id",
        pipeline: [
          ...budgetMatch,
          {
            $group: {
              _id: null,
              spent: {
                $sum: "$amount"
              }
            }
          }
        ],
        as: "spent"
      }
    },
    {
      $addFields: {
        spent: {
          $round: [
            {
              $first: "$spent.spent"
            },
            2
          ]
        },
        _id: {
          $toString: "$_id"
        }
      }
    }
  ]).toArray()
  return res
}

export async function getBudgetOverview() {
  const budgetMatch = await getBudgetAccountMatch()

  const res = await categories.aggregate<BudgetOverview>([{
    $addFields: {
      id: { $toString: "$_id" }
    }
  },
  {
    $lookup: {
      from: "transactions",
      localField: "id",
      foreignField: "userCategory._id",
      pipeline: [
        ...budgetMatch,
        { $sort: { date: -1 } },
        { $limit: 10 },
        { $project: { account_id: 1, date: 1, amount: 1, description: 1 } },
        ...accountJoinStages
      ],
      as: "transactions"
    }
  },
  {
    // Computed live (not read from the stored doc) so it honours budgetMatch.
    $lookup: {
      from: "transactions",
      localField: "id",
      foreignField: "userCategory._id",
      pipeline: [
        ...budgetMatch,
        { $group: { _id: null, spent: { $sum: "$amount" } } }
      ],
      as: "spent"
    }
  },
  {
    $addFields: {
      spent: { $round: [{ $ifNull: [{ $first: "$spent.spent" }, 0] }, 2] }
    }
  },
  {
    $group: {
      _id: "$date",
      date: { $first: "$date" },
      categories: {
        $push: {
          name: "$name",
          date: "$date",
          budget: "$budget",
          spent: "$spent",
          transactions: "$transactions"
        }
      },
      totalBudget: { $sum: "$budget" },
      totalSpent: { $sum: "$spent" }
    }
  }
  ]).toArray()

  return res
}

export async function getExistingBudgetSummaries() {
  const res = await categories.aggregate(
    [
      {
        $group: {
          _id: {
            date: "$date"
          },
          date: {
            $first: "$date"
          },
          budget: {
            $sum: "$budget"
          }
        }
      },
      {
        $project:
        /**
         * specifications: The fields to
         *   include or exclude.
         */
        {
          _id: 1,
          date: 1,
          budget: {
            $round: ["$budget", 2]
          },
          isoDate: {
            $dateFromString: {
              dateString: {
                $concat: ["$date", "-01T00:00:00Z"]  // e.g., '2025-07' → '2025-07-01T00:00:00Z'
              }
            }
          }
        }
      },
      {
        $sort: {
          isoDate: -1
        }
      },
    ]
  ).toArray()

  return res
}


