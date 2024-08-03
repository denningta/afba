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
              amount: "$amount"
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
                $sum: {
                  $abs: "$amount"
                }
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
  const res = await categories.aggregate<BudgetOverview>([
    {
      $addFields:
      /**
       * newField: The new field name.
       * expression: The new field expression.
       */
      {
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
              amount: "$amount"
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
                $sum: {
                  $abs: "$amount"
                }
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
    },
    {
      $addFields: {
        date: {
          $dateFromString: {
            dateString: "$date"
          }
        },
        dateString: "$date"
      }
    },
    {
      $group: {
        _id: "$dateString",
        date: {
          $first: "$dateString"
        },
        totalBudget: {
          $sum: "$budget"
        },
        totalSpent: {
          $sum: "$spent"
        },
        categories: {
          $push: {
            name: "$name",
            budget: "$budget",
            spent: "$spent"
          }
        },
        transactions: {
          $push: "$transactions"
        }
      }
    },
    {
      $addFields: {
        transactions: {
          $reduce: {
            input: "$transactions",
            initialValue: [],
            in: {
              $concatArrays: ["$$value", "$$this"]
            }
          }
        }
      }
    }
  ]).toArray()

  return res
}


