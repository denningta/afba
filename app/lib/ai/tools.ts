import * as z from "zod/v4"
import { listCategories, getExistingBudgetSummaries } from "@/app/queries/categories"
import { getBudgetBreakdown } from "@/app/queries/budgetBreakdown"
import { searchTransactions } from "@/app/queries/transactions"
import { listCategorySpending } from "@/app/queries/categorySpending"
import { listCategoryAverages } from "@/app/queries/categoryAverages"
import { listAccounts } from "@/app/queries/accounts"
import { actualAmount } from "@/app/components/budget/amounts"
import { Category } from "@/app/interfaces/categories"
import { BreakdownGroup } from "@/app/interfaces/budgetBreakdown"
import { MANUAL_ACCOUNT_ID } from "@/app/interfaces/account"
import { AssistantTool } from "./types"

// Read-only lookups the assistant can make. Each returns compact JSON: no
// database ids, no Plaid fields, nothing the model doesn't need to answer.
// Amounts the budget shows are "actual" (spending positive, income received
// positive); raw transactions keep Plaid's sign (positive = money out).

const month = z.string().regex(/^\d{4}-\d{2}$/).describe("Budget month as YYYY-MM")
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const round2 = (value: number) => Math.round(value * 100) / 100

function tool<Schema extends z.ZodType>(definition: AssistantTool<Schema>): AssistantTool {
  return definition as unknown as AssistantTool
}

const isExpense = (c: Category) => c.type === undefined || c.type === 'deduction'

const getBudget = tool({
  name: 'get_budget',
  label: 'Reading the budget',
  description: "One month's budget: every category with its type, budgeted amount and actual so far, plus totals for income, expenses and transfers. Actual matches the budget page (only accounts included in the budget; income shown as a positive amount received). Use list_budget_months first if unsure which months exist.",
  inputSchema: z.object({ month }),
  run: async ({ month }) => {
    const categories = await listCategories({ date: month }) as Category[]
    const rows = categories.map(c => ({
      name: c.name ?? 'Unnamed',
      type: c.type ?? 'deduction',
      budget: c.budget ?? 0,
      actual: round2(actualAmount(c)),
    }))
    const totals = (filter: (c: Category) => boolean) => {
      const subset = categories.filter(filter)
      return {
        budget: round2(subset.reduce((sum, c) => sum + (c.budget ?? 0), 0)),
        actual: round2(subset.reduce((sum, c) => sum + actualAmount(c), 0)),
      }
    }
    return {
      month,
      exists: categories.length > 0,
      categories: rows,
      totals: {
        income: totals(c => c.type === 'income'),
        expenses: totals(isExpense),
        transfers: totals(c => c.type === 'transfer'),
      },
    }
  },
  summarize: (result) => {
    const r = result as { categories: unknown[] }
    return `${r.categories.length} categories`
  },
})

const listBudgetMonths = tool({
  name: 'list_budget_months',
  label: 'Listing budget months',
  description: 'Every month that has a budget, newest first, with its total budgeted amount.',
  inputSchema: z.object({}),
  run: async () => {
    const months = await getExistingBudgetSummaries()
    return months.map(m => ({ month: m.date as string, totalBudget: m.budget as number }))
  },
  summarize: (result) => `${(result as unknown[]).length} months`,
})

const compactGroup = (group: BreakdownGroup) => ({
  count: group.count,
  moneyIn: group.totalIn,
  moneyOut: group.totalOut,
  examples: group.transactions.slice(0, 10).map(t => ({
    date: t.date,
    merchant: t.merchant_name ?? t.name,
    amount: t.amount,
    category: t.categoryName ?? null,
    categoryMonth: t.categoryDate ?? null,
    account: t.account?.name ?? null,
  })),
})

const getBudgetGaps = tool({
  name: 'get_budget_gaps',
  label: 'Checking what the budget leaves out',
  description: "Transactions dated in a month that the month's budget totals do NOT count, grouped by reason: uncategorized, in accounts excluded from the budget, assigned to transfer categories, or assigned to another month's category. Use this to explain why bank activity and budget actuals differ.",
  inputSchema: z.object({ month }),
  run: async ({ month }) => {
    const b = await getBudgetBreakdown(month)
    return {
      month,
      uncategorized: compactGroup(b.uncategorized),
      excludedAccounts: compactGroup(b.excludedAccounts),
      transfers: compactGroup(b.transfers),
      assignedToOtherMonth: compactGroup(b.otherMonth),
    }
  },
})

const searchTransactionsTool = tool({
  name: 'search_transactions',
  label: 'Searching transactions',
  description: 'Search transactions from accounts included in the budget. Returns the newest matches (up to `limit`) plus the count and total of ALL matches, so totals are correct even when rows are truncated. Amounts use the bank sign convention: positive is money out (spending), negative is money in. To find spending only, set minAmount to 0.01.',
  inputSchema: z.object({
    from: isoDate.optional().describe('Start date, inclusive (YYYY-MM-DD)'),
    to: isoDate.optional().describe('End date, inclusive (YYYY-MM-DD)'),
    category: z.string().optional().describe("Part of a category name, case-insensitive; 'uncategorized' for transactions with no category"),
    merchant: z.string().optional().describe('Part of the merchant name or description, case-insensitive'),
    budgetMonth: month.optional().describe("Only transactions assigned to this budget month's categories. Use with `category` to list exactly what makes up a category's actual in get_budget; from/to filter by transaction date instead, which can differ"),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    limit: z.number().int().min(1).max(200).optional().describe('Rows to return, default 50'),
  }),
  run: (input) => searchTransactions(input),
  summarize: (result) => {
    const r = result as { count: number }
    return `${r.count} transaction${r.count === 1 ? '' : 's'}`
  },
})

const getCategoryTrend = tool({
  name: 'get_category_trend',
  label: 'Comparing months',
  description: 'Actual per category for each of the last `months` months ending with `endMonth` (oldest first), matching each month\'s budget page. Optionally limit to some categories by name.',
  inputSchema: z.object({
    endMonth: month,
    months: z.number().int().min(1).max(24).optional().describe('Default 6'),
    categories: z.array(z.string()).optional().describe('Category names to include (case-insensitive); omit for all'),
  }),
  run: async ({ endMonth, months, categories }) => {
    const res = await listCategorySpending(endMonth, months ?? 6)
    const wanted = categories?.map(c => c.trim().toLowerCase())
    return {
      months: res.months,
      categories: res.categories
        .filter(c => !wanted || wanted.includes(c.name.toLowerCase()))
        .map(({ name, type, totals }) => ({ name, type: type ?? 'deduction', actualByMonth: totals })),
    }
  },
})

const getCategoryAverages = tool({
  name: 'get_category_averages',
  label: 'Averaging past months',
  description: 'Average monthly actual per category over the `months` full months before `month`.',
  inputSchema: z.object({
    month,
    months: z.number().int().min(1).max(24).optional().describe('Default 6'),
  }),
  run: ({ month, months }) => listCategoryAverages(month, months ?? 6),
})

const listAccountsTool = tool({
  name: 'list_accounts',
  label: 'Listing accounts',
  description: 'Linked bank accounts: name, type, last four digits, institution, current balance as last reported, and whether the account counts toward the budget.',
  inputSchema: z.object({}),
  run: async () => {
    const accounts = await listAccounts()
    return accounts.map(a => ({
      name: a.account_id === MANUAL_ACCOUNT_ID ? 'Manual / imported transactions' : a.name,
      type: a.subtype ?? a.type,
      mask: a.mask ?? null,
      institution: a.institutionName ?? null,
      currentBalance: a.currentBalance ?? null,
      includedInBudget: a.includeInBudget,
    }))
  },
  summarize: (result) => `${(result as unknown[]).length} accounts`,
})

// Fixed order: the tool list is part of the cached prompt prefix.
export const assistantTools: AssistantTool[] = [
  listBudgetMonths,
  getBudget,
  getBudgetGaps,
  searchTransactionsTool,
  getCategoryTrend,
  getCategoryAverages,
  listAccountsTool,
]
