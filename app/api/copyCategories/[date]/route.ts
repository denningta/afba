import { Category } from "@/app/interfaces/categories";
import { database } from "@/app/lib/mongodb";
import { listCategories } from "@/app/queries/categories";


export async function POST(request: Request, props: { params: Promise<{ date: string }> }) {
  const params = await props.params;
  try {
    const { currentDate } = await request.json()
    if (!currentDate) return Response.json({ message: 'currentDate is required' }, { status: 400 })

    const categories = await listCategories({ date: params.date })

    // Copy only the plan. listCategories also returns computed fields (spent,
    // transactions, id) that would otherwise be stored as stale copies.
    const copies: Category[] = categories.map(({ name, budget, type }) => ({
      name,
      budget,
      type,
      date: currentDate
    }))

    if (!copies.length) return Response.json({ inserted: 0 })

    const res = await database.collection<Category>('categories').insertMany(copies)
    return Response.json({ inserted: res.insertedCount })

  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Copy failed' }, { status: 500 })
  }
}
