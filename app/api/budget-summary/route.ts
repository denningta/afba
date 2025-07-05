export const dynamic = 'force-dynamic'

import { getExistingBudgetSummaries } from "@/app/queries/categories"

export async function GET(request: Request) {
  try {
    const budgetSummary = await getExistingBudgetSummaries()

    return Response.json(budgetSummary)

  } catch (error: any) {
    throw new Error(error)
  }
}
