import { categories } from "@/app/lib/mongodb"
import { Document } from "mongodb"
import { BudgetOverview } from "../components/budget/BudgetOverview"

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
          {
            $project: {
              date: "$date",
              description: "$description",
              amount: "$amount",
              category: "$category",
              originalDescription: "$originalDescription",
              status: "$status",
              userCategory: "$userCategory"
            }
          }
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
  const res = await categories.aggregate<BudgetOverview>([{
    $lookup: {
      from: "transactions",
      localField: "id",
      foreignField: "userCategory._id",
      pipeline: [
        { $sort: { date: -1 } },
        { $limit: 10 },
        { $project: { date: 1, amount: 1, description: 1 } }
      ],
      as: "transactions"
    }
  },
  {
    $group: {
      _id: "$dateString",
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


