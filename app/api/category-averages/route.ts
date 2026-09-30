import { listCategoryAverages } from "@/app/queries/categoryAverages"

export const dynamic = 'force-dynamic'

// GET /api/category-averages?date=YYYY-MM[&months=6]
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const months = Number(searchParams.get('months') ?? 6)

  if (!date || !/^\d{4}-\d{2}$/.test(date)) {
    return Response.json({ message: 'date must be YYYY-MM' }, { status: 400 })
  }
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    return Response.json({ message: 'months must be between 1 and 24' }, { status: 400 })
  }

  try {
    return Response.json(await listCategoryAverages(date, months))
  } catch (err: any) {
    console.error(err)
    return Response.json({ message: err?.message ?? "Couldn't compute averages" }, { status: 500 })
  }
}
