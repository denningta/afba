import plaidClient from "@/app/lib/plaid";
import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";

export async function POST(req: Request) {
  try {
    const { client_user_id } = await req.json()

    if (!client_user_id) throw new Error('Missing Plaid client_user_id')

    const configs: LinkTokenCreateRequest = {
      user: {
        client_user_id: client_user_id
      },
      client_name: 'afba',
      country_codes: [CountryCode.Us],
      language: 'en',
      // Update mode (re-login, account selection) lives in /api/update-link-token.
      products: [Products.Transactions],
    }

    const createTokenResponse = await plaidClient.linkTokenCreate(configs)

    return Response.json(createTokenResponse.data)

  } catch (err: any) {
    console.error(err?.response?.data ?? err)
    return Response.json(
      { message: err?.response?.data?.error_message ?? err?.message ?? 'Failed to create link token' },
      { status: 500 }
    )
  }

}
