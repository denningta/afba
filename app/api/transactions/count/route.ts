export const dynamic = 'force-dynamic'

import { countTransactions } from '@/app/queries/transactions'

// GET /api/transactions/count?needsCategory=true -> { count }
// Accepts the same filters as GET /api/transactions.
export async function GET(request: Request) {
  try {
    const count = await countTransactions(new URL(request.url).searchParams)
    return Response.json({ count })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to count transactions' }, { status: 500 })
  }
}
