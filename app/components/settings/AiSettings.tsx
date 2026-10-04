'use client'

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { ExternalLinkIcon, ShieldAlertIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import useAiSettings from "@/app/hooks/useAiSettings"
import FormError from "../auth/FormError"
import PageHeader from "../common/PageHeader"
import { ErrorState } from "../common/StateMessage"

const errorMessage = (err: any) => err?.response?.data?.message ?? err?.message ?? 'Please try again.'

// Admin-only: connect the household to an AI provider for the Assistant.
export default function AiSettings() {
  const { data, error, isLoading, mutate } = useAiSettings()
  // null until edited, so the fields show the saved values once they load.
  const [providerEdit, setProvider] = useState<string | null>(null)
  const [modelEdit, setModel] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const providerId = providerEdit ?? data?.provider ?? data?.providers[0]?.id
  const provider = data?.providers.find(p => p.id === providerId)
  const savedModel = data?.provider === providerId ? data?.model : undefined
  const model = modelEdit ?? savedModel ?? provider?.defaultModel
  const changingProvider = data?.configured && providerId !== data.provider

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await axios.put('/api/assistant/settings', { provider: providerId, model, apiKey: apiKey.trim() || undefined })
      setApiKey('')
      setModel(null)
      setProvider(null)
      await mutate()
      toast.success(apiKey.trim() ? 'API key checked and saved.' : 'Model updated.')
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async () => {
    try {
      await axios.delete('/api/assistant/settings')
      await mutate()
      toast.success('AI provider disconnected.')
    } catch (err) {
      toast.error("Couldn't disconnect.", { description: errorMessage(err) })
    }
  }

  if (error) return <Card><ErrorState title="Couldn't load AI settings" error={error} onRetry={() => mutate()} /></Card>

  const needsKey = !data?.configured || changingProvider
  const unchanged = !apiKey.trim() && model === data?.model && !changingProvider

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="AI assistant"
        description="Connect an AI provider so everyone in the household can ask questions about the budget on the Assistant page."
      />

      {data && !data.encryptionConfigured &&
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex gap-3 text-sm">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              API keys are stored encrypted, which needs <code className="font-mono">AFBA_ENCRYPTION_KEY</code> set
              on the server. Add a long random value (for example from <code className="font-mono">openssl rand -base64 32</code>)
              to the app&apos;s environment and restart it before saving a key.
            </div>
          </CardContent>
        </Card>
      }

      <Card>
        <form onSubmit={onSubmit} className="contents">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Provider
              {data?.configured && <Badge variant="secondary">Connected</Badge>}
            </CardTitle>
            <CardDescription>
              Your household pays the provider directly for what the assistant uses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !data ? <Skeleton className="h-40 w-full" /> : <>
              <div className="space-y-2">
                <Label htmlFor="ai-provider">Provider</Label>
                <Select value={providerId} onValueChange={(value) => { setProvider(value); setModel(null) }}>
                  <SelectTrigger id="ai-provider" className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.providers.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="ai-model" className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {provider?.models.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {provider?.models.find(m => m.id === model)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-key">API key</Label>
                <Input
                  id="ai-key"
                  type="password"
                  autoComplete="off"
                  placeholder={data.configured && !changingProvider ? `Saved key ${data.keyHint} · enter a new one to replace it` : 'Paste your API key'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  required={needsKey}
                />
                {provider &&
                  <a href={provider.keyHelpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline">
                    Get a key from {provider.label} <ExternalLinkIcon className="size-3" />
                  </a>
                }
              </div>

              <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                When someone asks the assistant a question, the budget figures and transactions it looks up are sent
                to {provider?.label ?? 'the provider'} to write the answer. Bank logins and Plaid credentials are never sent.
              </p>
              {formError && <FormError message={formError} />}
            </>}
          </CardContent>
          <CardFooter className="justify-between gap-2">
            {data?.configured
              ? <Button type="button" variant="ghost" className="text-destructive" onClick={onRemove}>Disconnect</Button>
              : <span />
            }
            <Button type="submit" disabled={saving || !data || unchanged || (needsKey && !apiKey.trim())}>
              {saving ? 'Checking…' : 'Save'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
