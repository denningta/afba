import { getSession, unauthorized } from "@/app/lib/session"
import { listConversations } from "@/app/queries/aiConversations"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return Response.json(await listConversations(session.user.id))
}
