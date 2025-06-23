import plaidClient from "@/app/lib/plaid"
import { listUser, User } from "@/app/queries/users"
import axios from "axios"

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
