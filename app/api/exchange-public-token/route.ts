import { requireAdmin } from "@/app/lib/session"
import plaidClient from "@/app/lib/plaid"
import { insertUser, listUser, replaceUser, User } from "@/app/queries/users"
import { findDuplicateAccounts, refreshAccounts } from "@/app/queries/accounts"

export async function POST(req: Request) {
  // Bank connections and which accounts count are household-wide settings.
  const denied = await requireAdmin()
  if (denied) return denied


  try {
    const { client_user_id, public_token } = await req.json()

    if (!client_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400 }
      )
    }

    if (!public_token) {
      return new Response(
        JSON.stringify({ error: 'Missing public_token' }),
        { status: 400 }
      )
    }

    const response = await plaidClient.itemPublicTokenExchange({ public_token })

    const access_token = response.data.access_token
    const item_id = response.data.item_id

    const { data: newItem } = await plaidClient.accountsGet({ access_token })
    const duplicates = await findDuplicateAccounts(newItem.item.institution_id, newItem.accounts, item_id)

    if (duplicates.length) {
      // Plaid already created (and bills for) the new item - disconnect it.
      await plaidClient.itemRemove({ access_token })

      const names = duplicates.map((a) => a.mask ? `${a.name} ••${a.mask}` : a.name)
      return Response.json(
        {
          error: 'DUPLICATE_ACCOUNT',
          message: `Already linked: ${names.join(', ')}. To add or fix accounts at ${newItem.item.institution_name ?? 'this institution'}, use the existing connection instead of linking it again.`,
          duplicates: names
        },
        { status: 409 }
      )
    }

    const existingUser = await listUser({ userId: client_user_id }) as User | null

    if (existingUser) {
      const items = (existingUser.items ?? []).filter((item) => item.item_id !== item_id)
      items.push({ item_id, plaidAccessToken: access_token })

      await replaceUser(
        { _id: existingUser._id },
        { userId: client_user_id, items }
      )
    } else {
      await insertUser({
        userId: client_user_id,
        items: [
          {
            item_id: item_id,
            plaidAccessToken: access_token,
          }
        ]
      })
    }

    await refreshAccounts()

    return Response.json({ message: `${item_id} successfully added to user ${client_user_id}` })

  } catch (err: any) {
    console.error(err?.response?.data ?? err)
    return Response.json(
      { message: err?.response?.data?.error_message ?? err?.message ?? 'Failed to link account' },
      { status: 500 }
    )
  }
}
