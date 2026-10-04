import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { ModelOption } from "@/app/lib/ai/types"

export interface AiSettingsResponse {
  configured: boolean
  provider?: string
  model?: string
  keyHint?: string
  updatedAt?: string
  encryptionConfigured: boolean
  providers: { id: string, label: string, models: ModelOption[], defaultModel: string, keyHelpUrl: string }[]
}

export const AI_SETTINGS_KEY = '/api/assistant/settings'

export default function useAiSettings() {
  return useSWR<AiSettingsResponse, Error>(AI_SETTINGS_KEY, fetcher)
}
