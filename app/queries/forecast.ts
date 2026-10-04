import { Document, ObjectId } from "mongodb"
import { format } from "date-fns"
import { forecastSettings, forecastSnapshots, paySchedules, scheduledTransactions, streamOverrides, transactions } from "../lib/mongodb"
import { ForecastSettings, PaySchedule, ScheduledTransaction, StreamOverride } from "../interfaces/forecast"
import { parseDisplayDate } from "../helpers/helperFunctions"
import type { ForecastSnapshot, PostedTransaction } from "../lib/forecast"

// --- Scheduled transactions -------------------------------------------------

export async function listScheduled(account_id?: string) {
  const res = await scheduledTransactions
    .find(account_id ? { account_id } : {})
    .sort({ date: 1 })
    .toArray()
  return res.map(({ _id, ...rest }) => ({ ...rest, _id: _id.toString() }) as ScheduledTransaction)
}

export async function upsertScheduled({ _id, ...item }: ScheduledTransaction) {
  if (_id) {
    await scheduledTransactions.updateOne({ _id: new ObjectId(String(_id)) }, { $set: item })
    return String(_id)
  }
  const res = await scheduledTransactions.insertOne(item)
  return res.insertedId.toString()
}

export async function deleteScheduled(id: string) {
  return scheduledTransactions.deleteOne({ _id: new ObjectId(id) })
}

// --- Stream overrides -------------------------------------------------------

export async function listStreamOverrides() {
  const res = await streamOverrides.find({}).toArray()
  return res.map(({ _id, ...rest }) => ({ ...rest, _id: _id.toString() }) as StreamOverride)
}

// One override per stream; fields set to null clear that part of it.
export async function upsertStreamOverride({ stream_id, ...fields }: StreamOverride) {
  return streamOverrides.updateOne({ stream_id }, { $set: { stream_id, ...fields } }, { upsert: true })
}

export async function deleteStreamOverride(stream_id: string) {
  return streamOverrides.deleteOne({ stream_id })
}

// --- Stream details from our own transactions ------------------------------

// For each Plaid recurring stream, the category the user has most often given
// its past transactions, and a merchant logo if any of them has one.
export async function getStreamDetails(streams: { stream_id: string, transaction_ids: string[] }[]) {
  const allIds = streams.flatMap(s => s.transaction_ids)
  const docs = await transactions
    .find(
      { transaction_id: { $in: allIds } },
      { projection: { transaction_id: 1, 'userCategory.name': 1, logo_url: 1, date: 1, amount: 1 } }
    )
    .toArray()
  const byId = new Map(docs.map(d => [d.transaction_id as string, d]))

  const details = new Map<string, { categoryName?: string, logoUrl?: string | null, recentAmounts: number[] }>()
  for (const stream of streams) {
    const counts = new Map<string, number>()
    let logoUrl: string | null = null
    const posted: { time: number, amount: number }[] = []
    for (const id of stream.transaction_ids) {
      const doc = byId.get(id)
      if (!doc) continue
      const name = doc.userCategory?.name as string | undefined
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
      logoUrl = logoUrl ?? (doc.logo_url as string | null) ?? null
      const time = parseDisplayDate(doc.date)?.getTime()
      if (time != null && typeof doc.amount === 'number') posted.push({ time, amount: doc.amount })
    }
    const categoryName = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    // Newest first, so the forecast can average the last few.
    const recentAmounts = posted.sort((a, b) => b.time - a.time).slice(0, 3).map(p => p.amount)
    details.set(stream.stream_id, { categoryName, logoUrl, recentAmounts })
  }
  return details
}

// --- Posted transactions, for matching expected items -----------------------

// The account's transactions dated on or after `since` (YYYY-MM-DD), with
// dates normalized to YYYY-MM-DD (stored dates are M/D/YYYY or ISO).
export async function listPostedTransactions(account_id: string, since: string): Promise<PostedTransaction[]> {
  const docs = await transactions
    .find({ account_id }, { projection: { transaction_id: 1, date: 1, amount: 1, merchant_name: 1, name: 1 } })
    .toArray()
  return docs.flatMap(doc => {
    const parsed = parseDisplayDate(doc.date)
    if (!parsed || typeof doc.amount !== 'number') return []
    const date = format(parsed, 'yyyy-MM-dd')
    if (date < since) return []
    return [{ transaction_id: doc.transaction_id, date, amount: doc.amount, name: doc.merchant_name || doc.name || '' }]
  })
}

// Outflows dated in `month` (YYYY-MM) with no category, in the accounts the
// budget counts. Already out of the balance but in no category's spent.
export async function getUncategorizedSpent(month: string, budgetMatch: Document[]) {
  const [year, mm] = month.split('-')
  const [res] = await transactions.aggregate<{ total: number }>([
    ...budgetMatch,
    {
      $match: {
        userCategory: { $exists: false },
        amount: { $gt: 0 },
        $or: [
          { date: { $regex: `^${month}-` } },
          { date: { $regex: `^0?${Number(mm)}/\\d{1,2}/${year}$` } },
        ],
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).toArray()
  return Math.round((res?.total ?? 0) * 100) / 100
}

// --- Pay schedules ------------------------------------------------------------

export async function listPaySchedules(account_id?: string) {
  const res = await paySchedules.find(account_id ? { account_id } : {}).toArray()
  return res.map(({ _id, ...rest }) => ({ ...rest, _id: _id.toString() }) as PaySchedule)
}

export async function upsertPaySchedule({ _id, ...schedule }: PaySchedule) {
  if (_id) {
    await paySchedules.updateOne({ _id: new ObjectId(String(_id)) }, { $set: schedule })
    return String(_id)
  }
  const res = await paySchedules.insertOne(schedule)
  return res.insertedId.toString()
}

export async function deletePaySchedule(id: string) {
  return paySchedules.deleteOne({ _id: new ObjectId(id) })
}

// --- Settings -------------------------------------------------------------------

export async function getForecastSettings(account_id: string): Promise<ForecastSettings> {
  const doc = await forecastSettings.findOne({ account_id })
  return { account_id, cushion: typeof doc?.cushion === 'number' ? doc.cushion : 0 }
}

export async function saveForecastSettings({ account_id, cushion }: ForecastSettings) {
  return forecastSettings.updateOne({ account_id }, { $set: { account_id, cushion } }, { upsert: true })
}

// --- Daily snapshots, for "what changed" ------------------------------------------

const SNAPSHOT_KEEP_DAYS = 60

// The newest snapshot from a day before `date`.
export async function getPreviousSnapshot(account_id: string, date: string) {
  return forecastSnapshots.findOne<ForecastSnapshot & { account_id: string }>(
    { account_id, date: { $lt: date } },
    { sort: { date: -1 }, projection: { _id: 0 } },
  )
}

// One snapshot per account per day (the latest view of that day).
export async function saveSnapshot(account_id: string, snapshot: ForecastSnapshot) {
  await forecastSnapshots.updateOne(
    { account_id, date: snapshot.date },
    { $set: { account_id, ...snapshot } },
    { upsert: true },
  )
  const cutoff = format(new Date(Date.now() - SNAPSHOT_KEEP_DAYS * 86_400_000), 'yyyy-MM-dd')
  await forecastSnapshots.deleteMany({ account_id, date: { $lt: cutoff } })
}
