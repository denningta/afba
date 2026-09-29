import { ObjectId } from "mongodb"
import { scheduledTransactions, streamOverrides, transactions } from "../lib/mongodb"
import { ScheduledTransaction, StreamOverride } from "../interfaces/forecast"

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
      { projection: { transaction_id: 1, 'userCategory.name': 1, logo_url: 1 } }
    )
    .toArray()
  const byId = new Map(docs.map(d => [d.transaction_id as string, d]))

  const details = new Map<string, { categoryName?: string, logoUrl?: string | null }>()
  for (const stream of streams) {
    const counts = new Map<string, number>()
    let logoUrl: string | null = null
    for (const id of stream.transaction_ids) {
      const doc = byId.get(id)
      if (!doc) continue
      const name = doc.userCategory?.name as string | undefined
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
      logoUrl = logoUrl ?? (doc.logo_url as string | null) ?? null
    }
    const categoryName = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    details.set(stream.stream_id, { categoryName, logoUrl })
  }
  return details
}
