'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/app/lib/auth-client"
import useCurrentUser from "@/app/hooks/useCurrentUser"
import FormError from "../auth/FormError"
import PageHeader from "../common/PageHeader"

function ProfileCard() {
  const { user, isAdmin } = useCurrentUser()
  // null until edited, so the field shows the saved name once it loads.
  const [edited, setName] = useState<string | null>(null)
  const name = edited ?? user?.name ?? ''
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const { error } = await authClient.updateUser({ name: name.trim() })
    setSaving(false)
    if (error) toast.error("Couldn't save your name.", { description: error.message })
    else toast.success('Name updated.')
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="contents">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to the rest of the household.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm">{user?.email}</p>
            <p className="text-xs text-muted-foreground">To change your email, ask a household admin.</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>{isAdmin ? 'Admin' : 'Member'}</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving || !name.trim() || name.trim() === user?.name}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [signOutOthers, setSignOutOthers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (next !== confirm) {
      setError("The new passwords don't match.")
      return
    }
    setSaving(true)
    setError(null)
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: signOutOthers,
    })
    setSaving(false)
    if (error) {
      setError(error.message ?? "Couldn't change your password.")
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    toast.success(signOutOthers ? 'Password changed. Other devices were signed out.' : 'Password changed.')
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="contents">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>At least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lets password managers pair the new password with this account. */}
          <input type="text" name="username" autoComplete="username" hidden readOnly />
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" required autoComplete="current-password"
              value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" required minLength={8} autoComplete="new-password"
              value={next} onChange={e => setNext(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" required autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sign-out-others" checked={signOutOthers} onCheckedChange={checked => setSignOutOthers(checked === true)} />
            <Label htmlFor="sign-out-others" className="font-normal">Sign out my other devices</Label>
          </div>
          <FormError message={error} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving}>{saving ? 'Changing…' : 'Change password'}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function AccountSettings() {
  return (
    <div>
      <PageHeader title="Account settings" description="Your name and password." />
      <div className="grid max-w-3xl gap-6">
        <ProfileCard />
        <PasswordCard />
      </div>
    </div>
  )
}
