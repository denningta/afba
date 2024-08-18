import { getBudgetOverview } from "@/app/queries/categories"

export async function GET(request: Request) {
  console.log(request.url) // force route to be dynamic and skip pre-rendering
  try {
    const budgetOverview = await getBudgetOverview()

    return Response.json(budgetOverview)

  } catch (error: any) {
    throw new Error(error)
  }
}
