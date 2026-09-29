export const dynamic = 'force-dynamic'

import { deleteStreamOverride, listStreamOverrides, upsertStreamOverride } from "@/app/queries/forecast"
import { StreamOverride } from "@/app/interfaces/forecast"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function GET() {
  try {
    return Response.json(await listStreamOverrides())
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to list overrides' }, { status: 500 })
  }
}

// Set any of hidden / amount / nextDate for a stream; null clears a field.
export async function POST(request: Request) {
  try {
    const { stream_id, hidden, amount, nextDate } = await request.json() as StreamOverride

    if (!stream_id) return Response.json({ message: 'stream_id is required' }, { status: 400 })
    if (amount != null && (typeof amount !== 'number' || !isFinite(amount))) return Response.json({ message: 'amount must be a number' }, { status: 400 })
    if (nextDate != null && !ISO_DATE.test(nextDate)) return Response.json({ message: 'nextDate must be YYYY-MM-DD' }, { status: 400 })

    const fields: StreamOverride = { stream_id }
    if (hidden !== undefined) fields.hidden = !!hidden
    if (amount !== undefined) fields.amount = amount
    if (nextDate !== undefined) fields.nextDate = nextDate
    await upsertStreamOverride(fields)
    return Response.json({ stream_id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to save override' }, { status: 500 })
  }
}

// Remove every override for a stream, restoring Plaid's values.
export async function DELETE(request: Request) {
  try {
    const stream_id = new URL(request.url).searchParams.get('stream_id')
    if (!stream_id) return Response.json({ message: 'stream_id is required' }, { status: 400 })
    await deleteStreamOverride(stream_id)
    return Response.json({ deleted: stream_id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to delete override' }, { status: 500 })
  }
}
