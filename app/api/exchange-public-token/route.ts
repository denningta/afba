import plaidClient from "@/app/lib/plaid"
import { insertUser } from "@/app/queries/users"

export async function POST(req: Request) {

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

    // TODO: Make this replace a current user after auth has been put in place

    await insertUser({
      userId: client_user_id,
      items: [
        {
          item_id: item_id,
          plaidAccessToken: access_token,
        }
      ]
    })

    return Response.json({ message: `${item_id} successfully added to user ${client_user_id}` })

  } catch (err: any) {
    console.error(err)
    return Response.json({ message: err, status: 500 })
  }
}
