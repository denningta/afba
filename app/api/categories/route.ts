import { Category } from "@/app/interfaces/categories";
import { database } from "@/app/lib/mongodb";
import { listCategories } from "@/app/queries/categories";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categories = await listCategories({ date: searchParams.get('date') ?? undefined })

    return Response.json(categories)

  } catch (error: any) {
    throw new Error(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const transactions = database.collection<Category>('categories')
    const res = transactions.insertMany(body)
    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}
