import { deleteUser, insertUser, replaceUser } from "@/app/queries/users"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let res: any

    if (!body._id) {
      res = await insertUser(body)
    } else {
      res = await replaceUser({ _id: body._id }, body)
    }

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }

}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()

    if (!body._id) throw new Error('_id is missing from the request body')

    const res = await deleteUser({ _id: body._id })

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}
