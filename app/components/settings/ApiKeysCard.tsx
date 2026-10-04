'use client'

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { format } from "date-fns"
import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authClient } from "@/app/lib/auth-client"
import FormError from "../auth/FormError"

const KEYS_KEY = 'api-keys'
const DAY = 60 * 60 * 24

// The plugin caps keys at a year.
const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never', days: null },
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: '365', label: '1 year', days: 365 },
]

type ApiKeyRow = {
  id: string
  name: string | null
  start: string | null
  createdAt: Date
  expiresAt: Date | null
  lastRequest: Date | null
}

async function loadKeys(): Promise<ApiKeyRow[]> {
  const { data, error } = await authClient.apiKey.list({ query: { sortBy: 'createdAt', sortDirection: 'desc' } })
  if (error) throw new Error(error.message ?? "Couldn't load your API keys.")
  return data.apiKeys
}

const formatDate = (date: Date | string | null, fallback: string) => date ? format(new Date(date), 'MMM d, yyyy') : fallback

function CreateKeyDialog({ open, onOpenChange, onCreated }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (key: string) => void
}) {
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('never')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reset = (next: boolean) => {
    if (!next) { setName(''); setExpiry('never'); setError(null) }
    onOpenChange(next)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const days = EXPIRY_OPTIONS.find(option => option.value === expiry)?.days
    const { data, error } = await authClient.apiKey.create({
      name: name.trim(),
      expiresIn: days ? days * DAY : null,
    })
    setSaving(false)
    if (error) {
      setError(error.message ?? "Couldn't create the key.")
      return
    }
    reset(false)
    onCreated(data.key)
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>The key can do anything you can do in afba.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input id="key-name" required maxLength={32} placeholder="e.g. Home Assistant"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Expires</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => reset(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create key'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NewKeyDialog({ apiKey, onOpenChange }: { apiKey: string | null, onOpenChange: (open: boolean) => void }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey ?? '')
      toast.success('Key copied.')
    } catch {
      // Clipboard access needs https or localhost; the key is selectable anyway.
      toast.error("Couldn't copy. Select the key and copy it yourself.")
    }
  }

  return (
    <Dialog open={apiKey !== null} onOpenChange={onOpenChange}>
      {/* Grid children default to min-width: auto, so the long key and curl
          line would stretch the dialog; min-w-0 keeps them inside it. */}
      <DialogContent className="sm:max-w-lg *:min-w-0">
        <DialogHeader>
          <DialogTitle>Copy your new API key</DialogTitle>
          <DialogDescription>You won&apos;t be able to see it again. If you lose it, revoke it and create a new one.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={apiKey ?? ''} className="font-mono" onFocus={e => e.target.select()} />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy key"><CopyIcon /></Button>
        </div>
        <div className="space-y-2">
          <Label>Use it like this</Label>
          <pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
            {`curl -H "x-api-key: ${apiKey}" ${origin}/api/transactions`}
          </pre>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeKeyDialog({ apiKey, onOpenChange, onDone }: {
  apiKey: ApiKeyRow | null
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [revoking, setRevoking] = useState(false)

  const revoke = async () => {
    if (!apiKey) return
    setRevoking(true)
    const { error } = await authClient.apiKey.delete({ keyId: apiKey.id })
    setRevoking(false)
    if (error) {
      toast.error("Couldn't revoke the key.", { description: error.message })
      return
    }
    toast.success(`${apiKey.name ?? 'Key'} revoked.`)
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={apiKey !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {apiKey?.name ?? 'this key'}?</DialogTitle>
          <DialogDescription>Anything using this key will stop working right away.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={revoking} onClick={revoke}>
            {revoking ? 'Revoking…' : 'Revoke key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ApiKeysCard() {
  const { data: keys, error, isLoading, mutate } = useSWR(KEYS_KEY, loadKeys)
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<ApiKeyRow | null>(null)
  const refresh = () => { mutate() }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Let scripts and other apps use the afba API as you. Send the key in an <code>x-api-key</code> header.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <PlusIcon /> Create key
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !keys?.length ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have any API keys.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name ?? 'Unnamed'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{key.start ? `${key.start}…` : '—'}</TableCell>
                  <TableCell>{formatDate(key.createdAt, '—')}</TableCell>
                  <TableCell>{formatDate(key.expiresAt, 'Never')}</TableCell>
                  <TableCell>{formatDate(key.lastRequest, 'Never')}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Revoke ${key.name ?? 'key'}`}
                      onClick={() => setRevoking(key)}>
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CreateKeyDialog open={creating} onOpenChange={setCreating} onCreated={key => { setNewKey(key); refresh() }} />
      <NewKeyDialog apiKey={newKey} onOpenChange={open => { if (!open) setNewKey(null) }} />
      <RevokeKeyDialog apiKey={revoking} onOpenChange={open => { if (!open) setRevoking(null) }} onDone={refresh} />
    </Card>
  )
}
