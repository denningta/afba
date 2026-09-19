import { categories, transactions } from "@/app/lib/mongodb"
import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"

export const MIN_SAMPLES = 2
export const MIN_CONFIDENCE = 0.75

export interface MerchantCategorySuggestion {
  categoryName: string
  confidence: number
  samples: number
}

interface MerchantCategoryGroup {
  _id: string | null
  categories: { name: string; count: number }[]
  total: number
}

export function getMerchantKey(transaction: Transaction): string | null {
  if (transaction.merchant_entity_id) return transaction.merchant_entity_id

  const fallback = transaction.merchant_name ?? transaction.name
  return fallback ? fallback.trim().toLowerCase() : null
}

// Builds a merchant -> best-category lookup from the user's own categorization
// history. Only transactions that were categorized by hand, or auto-categorized
// and later confirmed, count toward the stats -- an unconfirmed auto-guess is
// never allowed to reinforce itself on the next sync.
export async function buildMerchantCategoryMap(): Promise<Map<string, MerchantCategorySuggestion>> {
  const results = await transactions.aggregate<MerchantCategoryGroup>([
    {
      $match: {
        "userCategory.name": { $exists: true },
        $or: [
          { categorySource: { $ne: "auto" } },
          { categoryConfirmed: true }
        ]
      }
    },
    {
      $addFields: {
        merchantKey: {
          $ifNull: [
            "$merchant_entity_id",
            { $toLower: { $ifNull: ["$merchant_name", "$name"] } }
          ]
        }
      }
    },
    {
      $group: {
        _id: { merchantKey: "$merchantKey", categoryName: "$userCategory.name" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.merchantKey",
        categories: { $push: { name: "$_id.categoryName", count: "$count" } },
        total: { $sum: "$count" }
      }
    }
  ]).toArray()

  const map = new Map<string, MerchantCategorySuggestion>()

  for (const result of results) {
    if (!result._id || !result.categories.length) continue

    const top = result.categories.reduce((best, curr) => curr.count > best.count ? curr : best)
    const confidence = top.count / result.total

    if (result.total >= MIN_SAMPLES && confidence >= MIN_CONFIDENCE) {
      map.set(result._id, { categoryName: top.name, confidence, samples: result.total })
    }
  }

  return map
}

// Resolves a suggestion into the actual Category document for the transaction's
// month. Categories are scoped per month, so if the current month's budget
// category hasn't been created yet, the transaction is left uncategorized
// rather than fabricating a new category.
export async function suggestCategory(
  transaction: Transaction,
  merchantMap: Map<string, MerchantCategorySuggestion>
): Promise<{ category: Category; confidence: number } | null> {
  if (!transaction.date) return null

  const merchantKey = getMerchantKey(transaction)
  if (!merchantKey) return null

  const suggestion = merchantMap.get(merchantKey)
  if (!suggestion) return null

  const month = dateToYYYYMM(new Date(transaction.date))
  const category = await categories.findOne({ date: month, name: suggestion.categoryName }) as Category | null
  if (!category) return null

  return { category, confidence: suggestion.confidence }
}
