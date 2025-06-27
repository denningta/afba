export const dynamic = 'force-dynamic'

import { getBudgetOverview } from "@/app/queries/categories"

export async function GET(request: Request) {
  try {
    const budgetOverview = await getBudgetOverview()

    return Response.json(budgetOverview)

  } catch (error: any) {
    throw new Error(error)
  }
}
