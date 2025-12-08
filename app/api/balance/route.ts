import { listBalance } from "@/app/queries/balance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return Response.json({ error: 'accountId is required' }, { status: 400 })
    }

    const balance = await listBalance(accountId)

    return Response.json(balance)

  } catch (error: any) {
    throw new Error(error)
  }
}
