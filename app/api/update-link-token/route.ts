import plaidClient from "@/app/lib/plaid"
import { CountryCode, LinkTokenCreateRequest } from "plaid"
import { listUser, User } from "@/app/queries/users"
import { USER_ID } from "@/app/queries/accounts"

export interface UpdateLinkTokenBody {
  item_id?: string
  // Lets the user change which accounts are shared, e.g. add a card they
  // didn't tick on the bank's OAuth consent screen the first time.
  accountSelection?: boolean
}

/**
 * Creates a Link token in update mode for an existing item. The access token
 * is looked up here so it never has to reach the browser.
 */
export async function POST(req: Request) {
  try {
    const { item_id, accountSelection } = await req.json() as UpdateLinkTokenBody
    if (!item_id) return Response.json({ message: 'item_id is required' }, { status: 400 })

    const user = await listUser({ userId: USER_ID }) as User | null
    const item = user?.items?.find((i) => i.item_id === item_id)
    if (!item) return Response.json({ message: 'Item not found' }, { status: 404 })

    const configs: LinkTokenCreateRequest = {
      user: { client_user_id: USER_ID },
      client_name: 'afba',
      language: 'en',
      country_codes: [CountryCode.Us],
      access_token: item.plaidAccessToken,
    }
    if (accountSelection) configs.update = { account_selection_enabled: true }

    const response = await plaidClient.linkTokenCreate(configs)

    return Response.json({ link_token: response.data.link_token })

  } catch (err: any) {
    console.error('Link token (update mode) error:', err?.response?.data ?? err)
    return Response.json(
      { message: err?.response?.data?.error_message ?? err?.message ?? 'Failed to create update link token' },
      { status: 500 }
    )
  }
}
