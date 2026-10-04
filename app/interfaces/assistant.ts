// What the Assistant page shows for a conversation. The provider's own
// message history (with tool calls and results) is kept separately.
export interface ChatToolActivity {
  id: string
  name: string
  label: string
  input?: unknown
  summary?: string
  error?: string
  done?: boolean
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
  tools?: ChatToolActivity[]
  error?: string
}

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
}

export interface ConversationDetail extends ConversationSummary {
  turns: ChatTurn[]
}

// Newline-delimited JSON sent by POST /api/assistant/chat.
export type ChatStreamEvent =
  | { type: 'conversation', id: string, title: string }
  | { type: 'text', text: string }
  | { type: 'tool_start', id: string, name: string, label: string, input: unknown }
  | { type: 'tool_end', id: string, summary?: string, error?: string }
  | { type: 'done' }
  | { type: 'error', message: string }
