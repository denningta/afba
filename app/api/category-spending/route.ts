import { listCategorySpending } from "@/app/queries/categorySpending"

export const dynamic = 'force-dynamic'

// GET /api/category-spending?end=YYYY-MM[&months=12]
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const end = searchParams.get('end')
  const months = Number(searchParams.get('months') ?? 12)

  if (!end || !/^\d{4}-\d{2}$/.test(end)) {
    return Response.json({ message: 'end must be YYYY-MM' }, { status: 400 })
  }
  if (!Number.isInteger(months) || months < 1 || months > 36) {
    return Response.json({ message: 'months must be between 1 and 36' }, { status: 400 })
  }

  try {
    return Response.json(await listCategorySpending(end, months))
  } catch (err: any) {
    console.error(err)
    return Response.json({ message: err?.message ?? "Couldn't load category spending" }, { status: 500 })
  }
}
