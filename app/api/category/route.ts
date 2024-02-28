import { Category } from "@/app/interfaces/categories"
import { deleteCategory, insertCategory, listCategory, replaceCategory } from "@/app/queries/category"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    console.log(searchParams)

    const filter: Category = {
      name: searchParams.get('name') ?? undefined,
      date: (() => {
        const date = searchParams.get('date')
        if (!date) return undefined
        return new Date(date)
      })(),
      budget: (() => {
        const budget = searchParams.get('budget')
        if (!budget) return undefined
        return parseFloat(budget)
      })()
    }


    const keys = Object.keys(filter) as Array<keyof typeof filter>
    keys.forEach((key) =>
      filter[key] === undefined ? delete filter[key] : {}
    )

    const res = await listCategory(filter)

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let res: any

    if (!body._id) {
      res = await insertCategory(body)
    } else {
      res = await replaceCategory({ _id: body._id }, body)
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

    const res = await deleteCategory({ _id: body._id })

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}
