import Anthropic from "@anthropic-ai/sdk"
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod"
import { ToolError } from "@anthropic-ai/sdk/lib/tools/ToolError"
import { AssistantToolError, AssistantUsage, ChatProvider, ProviderError, StreamChatOptions } from "../types"

const DEFAULT_MODEL = 'claude-opus-5'
// Each iteration is one model reply; tool calls happen between them.
const MAX_ITERATIONS = 8

// Turns SDK errors into messages safe to show in the chat.
function toProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new ProviderError('Anthropic rejected the API key. An admin can update it in Settings → AI assistant.', 'auth')
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ProviderError('Anthropic is rate-limiting this API key. Try again in a minute.', 'rate_limit')
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new ProviderError(`Anthropic couldn't handle the request: ${error.message}`, 'bad_request')
  }
  if (error instanceof Anthropic.APIConnectionError || (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500)) {
    return new ProviderError('Anthropic is unavailable right now. Try again shortly.', 'unavailable')
  }
  return new ProviderError(error instanceof Error ? error.message : 'Something went wrong talking to Anthropic.')
}

// Leaves the stored history valid to continue from after an early stop: every
// tool call gets a result, and the conversation ends on an assistant turn.
function closeOut(history: Anthropic.Beta.BetaMessageParam[], note: string) {
  const last = history.at(-1)
  if (last?.role === 'assistant' && Array.isArray(last.content)) {
    const calls = last.content.filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === 'tool_use')
    if (calls.length) {
      history.push({
        role: 'user',
        content: calls.map(c => ({ type: 'tool_result' as const, tool_use_id: c.id, content: note, is_error: true })),
      })
    }
  }
  if (history.at(-1)?.role === 'user') {
    history.push({ role: 'assistant', content: note })
  }
}

export const anthropicProvider: ChatProvider = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  defaultModel: DEFAULT_MODEL,
  keyHelpUrl: 'https://console.anthropic.com/settings/keys',
  models: [
    { id: 'claude-opus-5', label: 'Claude Opus 5', description: 'Most capable. Best for multi-step questions.' },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', description: 'Faster and cheaper, good for most questions.' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Fastest and cheapest, for simple lookups.' },
  ],

  async validateKey(apiKey) {
    try {
      await new Anthropic({ apiKey, maxRetries: 0 }).models.list({ limit: 1 })
    } catch (error) {
      throw toProviderError(error)
    }
  },

  async streamChat({ apiKey, model, system, history, userMessage, tools, signal, onEvent }: StreamChatOptions) {
    const client = new Anthropic({ apiKey })

    const runnableTools = tools.map(t => ({
      ...betaZodTool({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        run: async (input, context) => {
          const id = context?.toolUse.id ?? t.name
          onEvent({ type: 'tool_start', id, name: t.name, label: t.label, input })
          try {
            const result = await t.run(input)
            onEvent({ type: 'tool_end', id, summary: t.summarize?.(result) })
            return JSON.stringify(result)
          } catch (error) {
            const message = error instanceof AssistantToolError ? error.message : 'The lookup failed.'
            if (!(error instanceof AssistantToolError)) console.error(`Assistant tool ${t.name} failed:`, error)
            onEvent({ type: 'tool_end', id, error: message })
            throw new ToolError(message)
          }
        },
      }),
      // Stream tool inputs as they're generated; betaZodTool still validates
      // each input against its schema before run() is called.
      eager_input_streaming: true,
    }))

    const runner = client.beta.messages.toolRunner({
      model,
      max_tokens: 64000,
      max_iterations: MAX_ITERATIONS,
      thinking: { type: 'adaptive' },
      // Frozen system prompt and fixed tool order keep the prefix cacheable;
      // per-conversation context goes in the first user turn instead.
      system,
      cache_control: { type: 'ephemeral' },
      tools: runnableTools,
      messages: [
        ...history as Anthropic.Beta.BetaMessageParam[],
        { role: 'user', content: userMessage },
      ],
      stream: true,
      // On a safety decline, let Anthropic retry on a suitable model.
      ...model === 'claude-opus-5'
        ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
        : {},
    }, { signal })

    const usage: AssistantUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
    let stoppedEarly: string | null = null

    try {
      for await (const messageStream of runner) {
        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            onEvent({ type: 'text', text: event.delta.text })
          }
        }
        const message = await messageStream.finalMessage()
        usage.inputTokens += message.usage.input_tokens
        usage.outputTokens += message.usage.output_tokens
        usage.cacheReadTokens += message.usage.cache_read_input_tokens ?? 0
        usage.cacheWriteTokens += message.usage.cache_creation_input_tokens ?? 0

        // The runner doesn't apply these: a refusal or a reply cut off mid
        // tool call must not have its tool calls run.
        if (message.stop_reason === 'refusal') {
          stoppedEarly = "Claude declined to answer that."
          break
        }
        if (message.stop_reason === 'max_tokens' && message.content.some(b => b.type === 'tool_use')) {
          stoppedEarly = 'The answer ran too long and was cut off.'
          break
        }
      }
    } catch (error) {
      const updated = [...runner.params.messages]
      closeOut(updated, signal?.aborted ? '[Stopped.]' : '[This answer failed before finishing.]')
      if (signal?.aborted) return { history: updated }
      const providerError = toProviderError(error)
      providerError.history = updated
      throw providerError
    }

    const updated = [...runner.params.messages]
    if (stoppedEarly) {
      onEvent({ type: 'text', text: `\n\n_${stoppedEarly}_` })
      closeOut(updated, `[${stoppedEarly}]`)
    } else if (updated.at(-1)?.role !== 'assistant') {
      // Hit the iteration cap with tool results still unanswered.
      const note = "I looked up a lot but couldn't finish. Try a narrower question."
      onEvent({ type: 'text', text: `\n\n_${note}_` })
      closeOut(updated, note)
    }
    onEvent({ type: 'done', usage })
    return { history: updated }
  },
}
