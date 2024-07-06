import { getBudgetOverview } from "@/app/queries/categories"

export async function GET() {
  try {
    const budgetOverview = await getBudgetOverview()

    return Response.json(budgetOverview)

  } catch (error: any) {
    throw new Error(error)
  }
}
