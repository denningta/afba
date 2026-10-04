import type * as z from "zod/v4"

// Provider-neutral pieces of the budget assistant. Each provider adapter
// (app/lib/ai/providers/*) maps these onto its own SDK.

// A read-only lookup the model can call. `run` returns plain data; adapters
// serialize it. Throw AssistantToolError for a problem the model should see.
export interface AssistantTool<Schema extends z.ZodType = z.ZodType> {
  name: string
  description: string
  inputSchema: Schema
  run: (input: z.infer<Schema>) => Promise<unknown>
  // A few words for the activity chip, e.g. "42 transactions".
  summarize?: (result: unknown) => string
  // Shown in the chip while running, e.g. "Searching transactions".
  label: string
}

export class AssistantToolError extends Error {}

export type AssistantEvent =
  | { type: 'text', text: string }
  | { type: 'tool_start', id: string, name: string, label: string, input: unknown }
  | { type: 'tool_end', id: string, summary?: string, error?: string }
  | { type: 'done', usage?: AssistantUsage }
  | { type: 'error', message: string }

export interface AssistantUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export interface ModelOption {
  id: string
  label: string
  description: string
}

// A user-facing failure (bad key, rate limit) with a message safe to show.
export class ProviderError extends Error {
  // From streamChat: the history up to the failure, so the question isn't lost.
  history?: unknown[]

  constructor(message: string, public kind: 'auth' | 'rate_limit' | 'unavailable' | 'bad_request' | 'unknown' = 'unknown') {
    super(message)
    this.name = 'ProviderError'
  }
}

export interface StreamChatOptions {
  apiKey: string
  model: string
  system: string
  // Earlier turns in this provider's own message format, appended to only.
  history: unknown[]
  userMessage: string
  tools: AssistantTool[]
  signal?: AbortSignal
  onEvent: (event: AssistantEvent) => void
}

export interface ChatProvider {
  id: string
  label: string
  models: ModelOption[]
  defaultModel: string
  // Where to get a key, shown in settings.
  keyHelpUrl: string
  // Throws ProviderError when the key doesn't work.
  validateKey: (apiKey: string) => Promise<void>
  // Runs one user turn to completion and returns the full updated history,
  // which the caller stores and passes back next turn.
  streamChat: (options: StreamChatOptions) => Promise<{ history: unknown[] }>
}
