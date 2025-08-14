import { listUser, User } from "@/app/queries/users"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ message: 'Query paramter \"userId\" is not defined', status: 500 })
  }


  try {
    const user = await listUser({ userId }) as User
    return Response.json(user)

  } catch (err) {
    return Response.json({ message: err, status: 500 })
  }
}
