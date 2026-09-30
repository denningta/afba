import { requireAdmin } from "@/app/lib/session"
import plaidClient from "@/app/lib/plaid"
import { listUser, User } from "@/app/queries/users"
import { removeItem } from "@/app/queries/accounts"

export interface GetItemParams {
  userId?: string
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json() as GetItemParams

    if (!userId) return Response.json("Missing userId from url searchParams")

    const user = await listUser({ userId }) as User
    if (!user) return Response.json({ message: 'User does not exist', status: 400 })
    if (!user.items) return Response.json({ message: 'User does not have any associated items', status: 400 })

    const itemResponses = await Promise.all(
      user.items.map(async ({ plaidAccessToken }) => {
        try {
          const res = await plaidClient.itemGet({
            access_token: plaidAccessToken
          })

          return res.data
        } catch (err) {
          return { error: true, message: (err as any).response.data || 'Failed to fetch data.' }
        }
      })
    )

    return Response.json(itemResponses)

  } catch (error: any) {
    throw new Error(error)
  }
}

export interface DeleteItemBody {
  item_id?: string
  deleteTransactions?: boolean
}

export async function DELETE(request: Request) {
  // Bank connections and which accounts count are household-wide settings.
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { item_id, deleteTransactions } = await request.json() as DeleteItemBody
    if (!item_id) return Response.json({ message: 'item_id is required' }, { status: 400 })

    const res = await removeItem(item_id, deleteTransactions === true)
    if (!res) return Response.json({ message: 'Item not found' }, { status: 404 })

    return Response.json(res)

  } catch (err: any) {
    console.error(err?.response?.data ?? err)
    return Response.json(
      { message: err?.response?.data?.error_message ?? 'Failed to remove item' },
      { status: 500 }
    )
  }
}
