export const dynamic = 'force-dynamic'

import { deletePaySchedule, listPaySchedules, upsertPaySchedule } from "@/app/queries/forecast"
import { PaySchedule } from "@/app/interfaces/forecast"

const FREQUENCIES: PaySchedule['frequency'][] = ['WEEKLY', 'BIWEEKLY', 'SEMI_MONTHLY', 'MONTHLY']
const WEEKEND_RULES: PaySchedule['weekendRule'][] = ['before', 'after', 'none']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  try {
    const account_id = new URL(request.url).searchParams.get('account_id') ?? undefined
    return Response.json(await listPaySchedules(account_id))
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to list pay schedules' }, { status: 500 })
  }
}

// Create, or update when _id is present.
export async function POST(request: Request) {
  try {
    const { _id, account_id, name, amount, frequency, anchorDate, semiMonthlyDays, weekendRule, replacesStreamId } = await request.json() as PaySchedule

    if (!account_id || !name?.trim()) return Response.json({ message: 'account_id and name are required' }, { status: 400 })
    if (typeof amount !== 'number' || !(amount > 0)) return Response.json({ message: 'amount must be a positive number' }, { status: 400 })
    if (!FREQUENCIES.includes(frequency)) return Response.json({ message: `frequency must be one of ${FREQUENCIES.join(', ')}` }, { status: 400 })
    if (!ISO_DATE.test(anchorDate ?? '')) return Response.json({ message: 'anchorDate must be YYYY-MM-DD' }, { status: 400 })
    if (!WEEKEND_RULES.includes(weekendRule)) return Response.json({ message: `weekendRule must be one of ${WEEKEND_RULES.join(', ')}` }, { status: 400 })
    const days = frequency === 'SEMI_MONTHLY' ? semiMonthlyDays : null
    if (days && (days.length !== 2 || days.some(d => !Number.isInteger(d) || d < 1 || d > 31) || days[0] === days[1])) {
      return Response.json({ message: 'semiMonthlyDays must be two different days of the month' }, { status: 400 })
    }

    const id = await upsertPaySchedule({
      _id, account_id, name: name.trim(), amount, frequency, anchorDate,
      semiMonthlyDays: days ? [Math.min(...days), Math.max(...days)] as [number, number] : null,
      weekendRule, replacesStreamId: replacesStreamId || null,
    })
    return Response.json({ _id: id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to save the pay schedule' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return Response.json({ message: 'id is required' }, { status: 400 })
    await deletePaySchedule(id)
    return Response.json({ deleted: id })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to delete the pay schedule' }, { status: 500 })
  }
}
