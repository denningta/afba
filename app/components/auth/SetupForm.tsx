'use client'

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/app/lib/auth-client"
import FormError from "./FormError"

export default function SetupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirm) {
      setError("The passwords don't match.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await axios.post('/api/setup', { name, email, password })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't create the account.")
      setSubmitting(false)
      return
    }
    const { error } = await authClient.signIn.email({ email, password, rememberMe: true })
    window.location.assign(error ? '/login' : '/')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set up afba</CardTitle>
        <CardDescription>
          Create the first account. It will be the household admin, able to add other people and
          manage bank connections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" required autoFocus value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" required
              value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create admin account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
