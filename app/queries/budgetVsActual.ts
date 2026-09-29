import { categories } from "@/app/lib/mongodb"
import { accountJoinStages, getBudgetAccountMatch } from "./accounts"

export interface BudgetVsActualQuery {
  date?: string
}

export const listDatesWithData = [
  {
    $addFields:
    /**
     * newField: The new field name.
     * expression: The new field expression.
     */
    {
      id: {
        $toString: "$_id"
      },
      monthDate: {
        $dateFromString: {
          dateString: {
            $concat: ["$date", "-01"]
          },
          format: "%Y-%m-%d"
        }
      }
    }
  },
  {
    $group:
    /**
     * _id: The id of the group.
     * fieldN: The first field name.
     */
    {
      _id: "$monthDate",
      date: {
        $first: "$monthDate"
      }
    }
  },
  {
    $sort:
    /**
     * Provide any number of field/order pairs.
     */
    {
      date: -1
    }
  }
]

export async function getBudgetVsActual({ date }: BudgetVsActualQuery) {
  if (!date) throw new Error('Date undefined in budget vs acual query params')

  // date is YYYY-MM. Read the parts directly: Mongo's $month is 1-based, and
  // new Date('YYYY-MM') is UTC midnight, which can land in the prior month locally.
  const [year, month] = date.split('-').map(Number)
  if (!year || !month) throw new Error(`Invalid budget vs actual date "${date}", expected YYYY-MM`)
  const budgetMatch = await getBudgetAccountMatch()

  const res = await categories.aggregate([
    {
      $addFields:
      /**
       * newField: The new field name.
       * expression: The new field expression.
       */
      {
        id: {
          $toString: "$_id"
        },
        monthDate: {
          $dateFromString: {
            dateString: {
              $concat: ["$date", "-01"]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    },
    {
      $match:
      /**
       * query: The query in MQL.
       */
      {
        $expr: {
          $and: [
            {
              $eq: [
                {
                  $month: "$monthDate"
                },
                month
              ]
            },
            {
              $eq: [
                {
                  $year: "$monthDate"
                },
                year
              ]
            }
          ]
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
              type: "$type"
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
            spent: {
              $abs: "$spent"
            }
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
