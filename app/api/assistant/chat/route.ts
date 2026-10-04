import { getSession, unauthorized } from "@/app/lib/session"
import { MissingEncryptionKeyError } from "@/app/lib/crypto"
import { getAiCredentials } from "@/app/queries/aiSettings"
import { createConversation, getConversation, saveConversation } from "@/app/queries/aiConversations"
import { getProvider } from "@/app/lib/ai/providers"
import { assistantTools } from "@/app/lib/ai/tools"
import { ASSISTANT_SYSTEM_PROMPT, withTurnContext } from "@/app/lib/ai/systemPrompt"
import { ProviderError } from "@/app/lib/ai/types"
import { ChatStreamEvent, ChatToolActivity, ChatTurn } from "@/app/interfaces/assistant"

export const dynamic = 'force-dynamic'
// Multi-step answers can take a while; don't let the platform cut them off.
export const maxDuration = 300

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_MESSAGE_LENGTH = 4000

// POST { message, conversationId?, today? } → newline-delimited JSON events
// (see ChatStreamEvent). Starts a conversation when no id is given.
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  const userId = session.user.id

  const body: { message?: string, conversationId?: string, today?: string } = await request.json()
  const message = body.message?.trim()
  if (!message) return Response.json({ message: 'Type a question first.' }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ message: `Keep questions under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 })
  }
  // The browser's date, not the server's: the app may run in UTC.
  const today = body.today && ISO_DATE.test(body.today) ? body.today : new Date().toISOString().slice(0, 10)

  let credentials
  try {
    credentials = await getAiCredentials()
  } catch (error) {
    const text = error instanceof MissingEncryptionKeyError
      ? error.message
      : "The saved API key can't be read. An admin needs to enter it again in Settings → AI assistant."
    return Response.json({ message: text }, { status: 500 })
  }
  const provider = getProvider(credentials?.provider)
  if (!credentials || !provider) {
    return Response.json({ message: 'No AI provider is connected yet.' }, { status: 409 })
  }

  let conversation = body.conversationId ? await getConversation(body.conversationId, userId) : null
  if (body.conversationId && !conversation) {
    return Response.json({ message: 'Conversation not found.' }, { status: 404 })
  }
  if (conversation && conversation.provider !== provider.id) {
    return Response.json({ message: 'This conversation used a different AI provider. Start a new one.' }, { status: 409 })
  }
  conversation ??= await createConversation({
    userId,
    title: message.length > 60 ? `${message.slice(0, 57)}…` : message,
    provider: provider.id,
    model: credentials.model,
  })
  const doc = conversation

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let open = true
      const send = (event: ChatStreamEvent) => {
        if (!open) return
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        } catch {
          open = false // the browser went away
        }
      }

      const reply: ChatTurn = { role: 'assistant', text: '', tools: [] }
      const tools = new Map<string, ChatToolActivity>()
      const turns: ChatTurn[] = [...doc.turns, { role: 'user', text: message }]
      send({ type: 'conversation', id: doc._id.toString(), title: doc.title })

      let history = doc.history
      try {
        const result = await provider.streamChat({
          apiKey: credentials.apiKey,
          model: credentials.model,
          system: ASSISTANT_SYSTEM_PROMPT,
          history: doc.history,
          userMessage: withTurnContext(message, today),
          tools: assistantTools,
          signal: request.signal,
          onEvent: (event) => {
            switch (event.type) {
              case 'text':
                reply.text += event.text
                send(event)
                break
              case 'tool_start': {
                const activity = { id: event.id, name: event.name, label: event.label, input: event.input }
                tools.set(event.id, activity)
                reply.tools!.push(activity)
                send(event)
                break
              }
              case 'tool_end': {
                const activity = tools.get(event.id)
                if (activity) Object.assign(activity, { summary: event.summary, error: event.error, done: true })
                send(event)
                break
              }
              case 'done':
                if (event.usage) console.info('Assistant usage', { conversation: doc._id.toString(), ...event.usage })
                break
            }
          },
        })
        history = result.history
        send({ type: 'done' })
      } catch (error) {
        const text = error instanceof ProviderError ? error.message : 'Something went wrong. Try again.'
        if (!(error instanceof ProviderError)) console.error('Assistant chat failed:', error)
        if (error instanceof ProviderError && error.history) history = error.history
        reply.error = text
        send({ type: 'error', message: text })
      } finally {
        // Save even after a stop or failure, so the question isn't lost.
        if (!reply.tools!.length) delete reply.tools
        await saveConversation(doc._id, userId, {
          history,
          turns: [...turns, reply],
          model: credentials.model,
        }).catch(error => console.error('Saving assistant conversation failed:', error))
        if (open) {
          open = false
          controller.close()
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
