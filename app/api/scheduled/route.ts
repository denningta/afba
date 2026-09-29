export const dynamic = 'force-dynamic'

import { deleteScheduled, listScheduled, upsertScheduled } from "@/app/queries/forecast"
import { ScheduledTransaction } from "@/app/interfaces/forecast"

const FREQUENCIES = ['once', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUALLY']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  try {
    const account_id = new URL(request.url).searchParams.get('account_id') ?? undefined
    return Response.json(await listScheduled(account_id))
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to list scheduled items' }, { status: 500 })
  }
}

// Create, or update when _id is present.
export async function POST(request: Request) {
  try {
    const body = await request.json() as ScheduledTransaction
    const { _id, account_id, name, amount, date, frequency, endDate, note } = body

    if (!account_id || !name?.trim()) return Response.json({ message: 'account_id and name are required' }, { status: 400 })
    if (typeof amount !== 'number' || !isFinite(amount)) return Response.json({ message: 'amount must be a number' }, { status: 400 })
    if (!ISO_DATE.test(date ?? '')) return Response.json({ message: 'date must be YYYY-MM-DD' }, { status: 400 })
    if (!FREQUENCIES.includes(frequency)) return Response.json({ message: `frequency must be one of ${FREQUENCIES.join(', ')}` }, { status: 400 })
    if (endDate && !ISO_DATE.test(endDate)) return Response.json({ message: 'endDate must be YYYY-MM-DD' }, { status: 400 })

    const id = await upsertScheduled({
      _id, account_id, name: name.trim(), amount, date, frequency,
      endDate: endDate || null, note: note || null,
    })
    return Response.json({ _id: id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to save scheduled item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return Response.json({ message: 'id is required' }, { status: 400 })
    await deleteScheduled(id)
    return Response.json({ deleted: id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to delete scheduled item' }, { status: 500 })
  }
}
