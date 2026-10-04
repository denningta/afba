import { aiSettings } from "@/app/lib/mongodb"
import { HOUSEHOLD_ID } from "@/app/lib/household"
import { decrypt, encrypt } from "@/app/lib/crypto"

// One AI provider connection per household, shared by everyone in it.
interface AiSettingsDoc {
  _id: string
  provider: string
  model: string
  encryptedKey: string
  // Last four characters, so admins can tell which key is saved.
  keyHint: string
  updatedBy: string
  updatedAt: Date
}

const collection = () => aiSettings as unknown as import("mongodb").Collection<AiSettingsDoc>

export interface AiSettingsSummary {
  configured: boolean
  provider?: string
  model?: string
  keyHint?: string
  updatedAt?: string
}

export async function getAiSettingsSummary(): Promise<AiSettingsSummary> {
  const doc = await collection().findOne({ _id: HOUSEHOLD_ID })
  if (!doc) return { configured: false }
  return {
    configured: true,
    provider: doc.provider,
    model: doc.model,
    keyHint: doc.keyHint,
    updatedAt: doc.updatedAt.toISOString(),
  }
}

// The decrypted key, for server-side provider calls only. Never send it to the browser.
export async function getAiCredentials() {
  const doc = await collection().findOne({ _id: HOUSEHOLD_ID })
  if (!doc) return null
  return { provider: doc.provider, model: doc.model, apiKey: decrypt(doc.encryptedKey) }
}

export async function saveAiSettings({ provider, model, apiKey, updatedBy }: {
  provider: string
  model: string
  // Omit to keep the saved key and only change the model.
  apiKey?: string
  updatedBy: string
}) {
  const keyFields = apiKey
    ? { encryptedKey: encrypt(apiKey), keyHint: `…${apiKey.slice(-4)}` }
    : {}
  await collection().updateOne(
    { _id: HOUSEHOLD_ID },
    { $set: { provider, model, ...keyFields, updatedBy, updatedAt: new Date() } },
    { upsert: !!apiKey },
  )
}

export async function deleteAiSettings() {
  await collection().deleteOne({ _id: HOUSEHOLD_ID })
}
