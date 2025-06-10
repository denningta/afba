import { categories } from "@/app/lib/mongodb"

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

  const month = new Date(date).getMonth()
  const year = new Date(date).getFullYear()

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
          {
            $project: {
              date: "$date",
              description: "$description",
              amount: "$amount",
              type: "$type"
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
