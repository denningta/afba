import { Category } from "@/app/interfaces/categories";
import { database } from "@/app/lib/mongodb";
import { listCategories } from "@/app/queries/categories";


export async function POST(
  request: Request,
  { params }: { params: { date: string } }
) {
  try {
    const body = await request.json()
    const { currentDate } = body
    const date = params.date

    const categories = await listCategories({ date: date })

    const updatedCategories: Category[] = categories.map(({ _id, ...rest }) => ({
      ...rest,
      date: currentDate
    }))

    const transactions = database.collection<Category>('categories')
    const res = transactions.insertMany(updatedCategories)
    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}
