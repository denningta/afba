import plaidClient from "@/app/lib/plaid";
import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";

export async function POST(req: Request) {
  try {
    const { client_user_id, access_token } = await req.json()

    if (!client_user_id) throw new Error('Missing Plaid client_user_id')

    const configs: LinkTokenCreateRequest = {
      user: {
        client_user_id: client_user_id
      },
      client_name: 'afba',
      country_codes: [CountryCode.Us],
      language: 'en',
    }

    // If passing in an access token in the POST body this will enable "update mode"
    if (access_token) {
      configs.access_token = access_token
    } else {
      configs.products = [Products.Transactions]
    }

    console.log(configs)

    const createTokenResponse = await plaidClient.linkTokenCreate(configs)

    console.log(createTokenResponse.data)

    return Response.json(createTokenResponse.data)

  } catch (err: any) {
    console.error(err)
    return Response.json({ message: err, status: 500 })
  }

}
