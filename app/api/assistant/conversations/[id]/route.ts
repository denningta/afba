import { getSession, unauthorized } from "@/app/lib/session"
import { deleteConversation, getConversation } from "@/app/queries/aiConversations"
import { ConversationDetail } from "@/app/interfaces/assistant"

export const dynamic = 'force-dynamic'

const notFound = () => Response.json({ message: 'Conversation not found.' }, { status: 404 })

// Only the person who started a conversation can read or delete it.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const doc = await getConversation((await params).id, session.user.id)
  if (!doc) return notFound()
  const detail: ConversationDetail = {
    id: doc._id.toString(),
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
    turns: doc.turns,
  }
  return Response.json(detail)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  return await deleteConversation((await params).id, session.user.id)
    ? Response.json({ deleted: true })
    : notFound()
}
