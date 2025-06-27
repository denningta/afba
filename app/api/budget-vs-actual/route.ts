export const dynamic = 'force-dynamic'

import { getBudgetVsActual } from "@/app/queries/budgetVsActual"


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const budgetVsActual = await getBudgetVsActual({ date: searchParams.get('date') ?? undefined })

    return Response.json(budgetVsActual)

  } catch (error: any) {
    throw new Error(error)
  }
}
