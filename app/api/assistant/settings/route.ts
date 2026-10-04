import { getSession, requireAdmin, unauthorized } from "@/app/lib/session"
import { isEncryptionConfigured, MissingEncryptionKeyError } from "@/app/lib/crypto"
import { deleteAiSettings, getAiSettingsSummary, saveAiSettings } from "@/app/queries/aiSettings"
import { getProvider, providers } from "@/app/lib/ai/providers"
import { ProviderError } from "@/app/lib/ai/types"

export const dynamic = 'force-dynamic'

// Which provider is connected (never the key itself) and what can be chosen.
export async function GET() {
  if (!await getSession()) return unauthorized()
  return Response.json({
    ...await getAiSettingsSummary(),
    encryptionConfigured: isEncryptionConfigured(),
    providers: Object.values(providers).map(({ id, label, models, defaultModel, keyHelpUrl }) => ({
      id, label, models, defaultModel, keyHelpUrl,
    })),
  })
}

// Admin only: connect a provider, or change the model. A new key is checked
// with the provider before it's saved.
export async function PUT(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied
  const session = (await getSession())!

  const { provider: providerId, model, apiKey }: { provider?: string, model?: string, apiKey?: string } = await request.json()
  const provider = getProvider(providerId)
  if (!provider) return Response.json({ message: 'Unknown provider.' }, { status: 400 })
  if (!model || !provider.models.some(m => m.id === model)) {
    return Response.json({ message: 'Unknown model.' }, { status: 400 })
  }

  const key = apiKey?.trim()
  if (!key && !(await getAiSettingsSummary()).configured) {
    return Response.json({ message: 'Enter an API key.' }, { status: 400 })
  }

  try {
    if (key) await provider.validateKey(key)
    await saveAiSettings({ provider: provider.id, model, apiKey: key || undefined, updatedBy: session.user.id })
  } catch (error) {
    if (error instanceof ProviderError || error instanceof MissingEncryptionKeyError) {
      return Response.json({ message: error.message }, { status: 400 })
    }
    throw error
  }
  return Response.json(await getAiSettingsSummary())
}

export async function DELETE() {
  const denied = await requireAdmin()
  if (denied) return denied
  await deleteAiSettings()
  return Response.json({ configured: false })
}
