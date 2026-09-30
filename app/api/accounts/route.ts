import { requireAdmin } from "@/app/lib/session"
import plaidClient from "@/app/lib/plaid"
import { listUser, User } from "@/app/queries/users"
import { listAccounts, refreshAccounts, setIncludeInBudget } from "@/app/queries/accounts"

export interface GetAccountsParams {
  userId?: string
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json() as GetAccountsParams

    if (!userId) return Response.json("Missing userId from url searchParams")

    const user = await listUser({ userId }) as User
    if (!user) return Response.json({ message: 'User does not exist', status: 400 })
    if (!user.items) return Response.json({ message: 'User does not have any associated items', status: 400 })

    const accountsRes = await Promise.all(
      user.items.map(async ({ item_id, plaidAccessToken }) => {
        try {
          const res = await plaidClient.accountsGet({
            access_token: plaidAccessToken
          })

          return res.data

        } catch (err: any) {
          // Keep item_id so the UI can offer update mode (e.g. ITEM_LOGIN_REQUIRED).
          return { item_id, error: err?.response?.data ?? { error_message: 'Failed to fetch data.' } }
        }
      })
    )

    // Keep the local accounts cache in step with what the Connect page shows.
    await refreshAccounts()

    return Response.json(accountsRes)

  } catch (err) {

  }

}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const res = searchParams.get('refresh') === 'true'
    ? await refreshAccounts()
    : await listAccounts()

  return Response.json(res)
}

export interface PatchAccountBody {
  account_id?: string
  includeInBudget?: boolean
}

export async function PATCH(request: Request) {
  // Bank connections and which accounts count are household-wide settings.
  const denied = await requireAdmin()
  if (denied) return denied

  const { account_id, includeInBudget } = await request.json() as PatchAccountBody

  if (!account_id || typeof includeInBudget !== 'boolean') {
    return Response.json({ message: 'account_id and boolean includeInBudget are required' }, { status: 400 })
  }

  const res = await setIncludeInBudget(account_id, includeInBudget)
  if (!res.matchedCount) return Response.json({ message: 'Account not found' }, { status: 404 })

  return Response.json({ account_id, includeInBudget })
}


