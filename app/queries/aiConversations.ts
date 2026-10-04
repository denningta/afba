import { Collection, ObjectId } from "mongodb"
import { aiConversations } from "@/app/lib/mongodb"
import { ChatTurn, ConversationSummary } from "@/app/interfaces/assistant"

// Each person's own chats. `history` is the provider's message format (only
// ever appended to); `turns` is the simplified transcript the page shows.
interface ConversationDoc {
  _id: ObjectId
  userId: string
  title: string
  provider: string
  model: string
  history: unknown[]
  turns: ChatTurn[]
  createdAt: Date
  updatedAt: Date
}

const collection = () => aiConversations as unknown as Collection<ConversationDoc>

const byOwner = (id: string, userId: string) =>
  ObjectId.isValid(id) ? { _id: new ObjectId(id), userId } : null

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const docs = await collection()
    .find({ userId }, { projection: { title: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray()
  return docs.map(d => ({ id: d._id.toString(), title: d.title, updatedAt: d.updatedAt.toISOString() }))
}

export async function getConversation(id: string, userId: string) {
  const filter = byOwner(id, userId)
  return filter ? collection().findOne(filter) : null
}

export async function createConversation(fields: Pick<ConversationDoc, 'userId' | 'title' | 'provider' | 'model'>) {
  const now = new Date()
  const doc = { ...fields, _id: new ObjectId(), history: [], turns: [], createdAt: now, updatedAt: now }
  await collection().insertOne(doc)
  return doc
}

export async function saveConversation(id: ObjectId, userId: string, update: { history: unknown[], turns: ChatTurn[], model: string }) {
  await collection().updateOne({ _id: id, userId }, { $set: { ...update, updatedAt: new Date() } })
}

export async function deleteConversation(id: string, userId: string) {
  const filter = byOwner(id, userId)
  if (!filter) return false
  const res = await collection().deleteOne(filter)
  return res.deletedCount > 0
}
