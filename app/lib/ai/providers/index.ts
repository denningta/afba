import { ChatProvider } from "../types"
import { anthropicProvider } from "./anthropic"

// Add an adapter here (OpenAI, Ollama, …) to offer another provider.
export const providers: Record<string, ChatProvider> = {
  [anthropicProvider.id]: anthropicProvider,
}

export const defaultProvider = anthropicProvider

export function getProvider(id: string | undefined): ChatProvider | undefined {
  return id ? providers[id] : undefined
}
