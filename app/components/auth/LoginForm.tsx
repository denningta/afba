'use client'

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/app/lib/auth-client"
import FormError from "./FormError"

// Only same-site paths, so a crafted ?next= can't bounce people elsewhere.
const safeNext = (next: string | null) =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

export default function LoginForm() {
  const next = safeNext(useSearchParams().get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await authClient.signIn.email({ email, password, rememberMe })
    if (error) {
      setError(error.status === 429
        ? 'Too many attempts. Wait a minute and try again.'
        : error.message ?? "Couldn't sign in.")
      setSubmitting(false)
      return
    }
    // A full load, so the server renders the app with the new session.
    window.location.assign(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in to afba</CardTitle>
        <CardDescription>Use the email and password your household admin set up for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked === true)} />
            <Label htmlFor="remember" className="font-normal">Keep me signed in</Label>
          </div>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot your password? Ask a household admin to reset it.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
