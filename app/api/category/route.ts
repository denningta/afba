import { deleteUndefinedKeys } from "@/app/helpers/helperFunctions"
import { Category } from "@/app/interfaces/categories"
import { listCategory, upsertCategory } from "@/app/queries/category"
import { ObjectId } from "mongodb"

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
    console.log(body)

    const filter = { _id: body?._id }

    const res = upsertCategory(filter, body)

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}
