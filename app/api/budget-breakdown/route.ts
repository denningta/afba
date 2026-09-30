export const dynamic = 'force-dynamic'

import { getBudgetBreakdown } from "@/app/queries/budgetBreakdown"

// GET /api/budget-breakdown?date=YYYY-MM
// What the month's KPIs leave out (uncategorized, excluded accounts,
// transfers, other-month assignments), with totals and sample transactions.
export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get('date')
    if (!date || !/^\d{4}-\d{2}$/.test(date)) {
      return Response.json({ message: 'date must be YYYY-MM' }, { status: 400 })
    }
    return Response.json(await getBudgetBreakdown(date))
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to build the breakdown' }, { status: 500 })
  }
}
