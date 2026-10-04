import { useCallback, useRef, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import fetcher from "@/app/lib/fetcher"
import { ChatStreamEvent, ChatTurn, ConversationDetail, ConversationSummary } from "@/app/interfaces/assistant"

const CONVERSATIONS_KEY = '/api/assistant/conversations'

export function useConversations() {
  return useSWR<ConversationSummary[], Error>(CONVERSATIONS_KEY, fetcher)
}

// One open conversation: sends questions to /api/assistant/chat and builds
// the reply as its newline-delimited JSON events stream in.
export default function useAssistantChat() {
  const { mutate } = useSWRConfig()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Applies a change to the reply being streamed (always the last turn).
  const updateReply = (change: (reply: ChatTurn) => ChatTurn) =>
    setTurns(prev => [...prev.slice(0, -1), change(prev[prev.length - 1])])

  const handleEvent = useCallback((event: ChatStreamEvent) => {
    switch (event.type) {
      case 'conversation':
        setConversationId(event.id)
        break
      case 'text':
        updateReply(reply => ({ ...reply, text: reply.text + event.text }))
        break
      case 'tool_start':
        updateReply(reply => ({
          ...reply,
          tools: [...reply.tools ?? [], { id: event.id, name: event.name, label: event.label, input: event.input }],
        }))
        break
      case 'tool_end':
        updateReply(reply => ({
          ...reply,
          tools: reply.tools?.map(t => t.id === event.id ? { ...t, summary: event.summary, error: event.error, done: true } : t),
        }))
        break
      case 'error':
        updateReply(reply => ({ ...reply, error: event.message }))
        break
    }
  }, [])

  const send = useCallback(async (message: string) => {
    const text = message.trim()
    if (!text || streaming) return

    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    setTurns(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: '', tools: [] }])

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId, today: format(new Date(), 'yyyy-MM-dd') }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null)
        updateReply(reply => ({ ...reply, error: body?.message ?? `Request failed (${res.status})` }))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line) as ChatStreamEvent)
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        updateReply(reply => ({ ...reply, text: reply.text ? `${reply.text}\n\n_Stopped._` : '_Stopped._' }))
      } else {
        updateReply(reply => ({ ...reply, error: 'Lost the connection. Try again.' }))
        console.error(error)
      }
    } finally {
      abortRef.current = null
      setStreaming(false)
      mutate(CONVERSATIONS_KEY)
    }
  }, [conversationId, streaming, handleEvent, mutate])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const open = useCallback(async (id: string) => {
    abortRef.current?.abort()
    setLoading(true)
    try {
      const detail: ConversationDetail = await fetcher(`/api/assistant/conversations/${id}`)
      setConversationId(detail.id)
      setTurns(detail.turns)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setConversationId(null)
    setTurns([])
  }, [])

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/assistant/conversations/${id}`, { method: 'DELETE' })
    if (id === conversationId) reset()
    mutate(CONVERSATIONS_KEY)
  }, [conversationId, reset, mutate])

  return { conversationId, turns, streaming, loading, send, stop, open, reset, remove }
}
