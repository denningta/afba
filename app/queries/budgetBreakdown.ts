import { Document } from "mongodb"
import { categories, transactions } from "../lib/mongodb"
import { accountJoinStages, getBudgetAccountMatch } from "./accounts"
import { BreakdownGroup, BreakdownTransaction, BudgetBreakdown } from "../interfaces/budgetBreakdown"

// How many transactions each group returns to list; the totals cover all.
const LIST_LIMIT = 50

// Transaction dates are stored as M/D/YYYY strings; parse them to match a month.
const inMonthStages = (month: string): Document[] => {
  const [year, m] = month.split('-').map(Number)
  return [
    { $addFields: { _isoDate: { $dateFromString: { dateString: "$date", onError: null, onNull: null } } } },
    { $match: { $expr: { $and: [{ $eq: [{ $year: "$_isoDate" }, year] }, { $eq: [{ $month: "$_isoDate" }, m] }] } } },
  ]
}

async function summarize(pipeline: Document[]): Promise<BreakdownGroup> {
  const [res] = await transactions.aggregate<{
    summary: { count: number, totalIn: number, totalOut: number }[]
    items: BreakdownTransaction[]
  }>([
    ...pipeline,
    {
      $facet: {
        summary: [{
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalIn: { $sum: { $cond: [{ $lt: ["$amount", 0] }, { $multiply: ["$amount", -1] }, 0] } },
            totalOut: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
          }
        }],
        items: [
          { $sort: { _isoDate: -1 } },
          { $limit: LIST_LIMIT },
          ...accountJoinStages,
          {
            $project: {
              _id: { $toString: "$_id" },
              date: 1, amount: 1, name: 1, merchant_name: 1, displayName: 1, logo_url: 1,
              account: { name: "$account.name", mask: "$account.mask" },
              categoryName: "$userCategory.name",
              categoryDate: "$userCategory.date",
            }
          },
        ],
      }
    },
  ]).toArray()

  const summary = res?.summary[0]
  return {
    count: summary?.count ?? 0,
    totalIn: round2(summary?.totalIn ?? 0),
    totalOut: round2(summary?.totalOut ?? 0),
    transactions: res?.items ?? [],
  }
}

export async function getBudgetBreakdown(month: string): Promise<BudgetBreakdown> {
  const budgetMatch = await getBudgetAccountMatch()
  const monthCategories = await categories.find({ date: month }, { projection: { _id: 1, type: 1 } }).toArray()
  const monthIds = monthCategories.map(c => c._id.toString())
  const transferIds = monthCategories.filter(c => c.type === 'transfer').map(c => c._id.toString())

  // Excluded accounts: the opposite of the budget match. No match stage means
  // every account is included, so that group is empty.
  const excludedMatch = budgetMatch.length
    ? [{ $match: { $nor: [budgetMatch[0].$match] } }]
    : [{ $match: { _id: null } }]

  const [uncategorized, excludedAccounts, transfers, otherMonth] = await Promise.all([
    summarize([...budgetMatch, { $match: { userCategory: { $exists: false } } }, ...inMonthStages(month)]),
    summarize([...excludedMatch, ...inMonthStages(month)]),
    summarize([...budgetMatch, { $match: { "userCategory._id": { $in: transferIds } } }, { $addFields: { _isoDate: { $dateFromString: { dateString: "$date", onError: null, onNull: null } } } }]),
    summarize([...budgetMatch, { $match: { "userCategory._id": { $exists: true, $nin: monthIds } } }, ...inMonthStages(month)]),
  ])

  return { month, uncategorized, excludedAccounts, transfers, otherMonth }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
