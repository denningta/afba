'use client'

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { format } from "date-fns"
import { KeyRoundIcon, LogOutIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authClient } from "@/app/lib/auth-client"
import useCurrentUser from "@/app/hooks/useCurrentUser"
import FormError from "../auth/FormError"
import PageHeader from "../common/PageHeader"
import { EmptyState, ErrorState } from "../common/StateMessage"
import { UserAvatar } from "../UserMenu"

type Role = 'admin' | 'member'

interface HouseholdUser {
  id: string
  name: string
  email: string
  role?: string | null
  createdAt: Date | string
}

const USERS_KEY = 'auth:users'

const loadUsers = async (): Promise<HouseholdUser[]> => {
  const { data, error } = await authClient.admin.listUsers({ query: { limit: 100, sortBy: 'createdAt' } })
  if (error) throw new Error(error.message ?? "Couldn't load users.")
  return data.users as HouseholdUser[]
}

const RoleBadge = ({ role }: { role?: string | null }) =>
  <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role === 'admin' ? 'Admin' : 'Member'}</Badge>

function RoleSelect({ id, value, onChange }: { id: string, value: Role, onChange: (role: Role) => void }) {
  return (
    <Select value={value} onValueChange={value => onChange(value as Role)}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Member: uses the budget</SelectItem>
        <SelectItem value="admin">Admin: also manages users and bank connections</SelectItem>
      </SelectContent>
    </Select>
  )
}

// Shared shell: runs `save`, shows its error inline, closes on success.
function FormDialog({ open, onOpenChange, title, description, submitLabel, onSubmit, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  onSubmit: () => Promise<string | null>
  children: React.ReactNode
}) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const failure = await onSubmit()
    setSaving(false)
    if (failure) setError(failure)
    else onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) setError(null); onOpenChange(next) }}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddUserDialog({ open, onOpenChange, onDone }: { open: boolean, onOpenChange: (open: boolean) => void, onDone: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('member')

  const reset = (next: boolean) => {
    if (!next) { setName(''); setEmail(''); setPassword(''); setRole('member') }
    onOpenChange(next)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={reset}
      title="Add user"
      description="Give them this email and temporary password; they can change the password under Account settings."
      submitLabel="Add user"
      onSubmit={async () => {
        const { error } = await authClient.admin.createUser({ name: name.trim(), email: email.trim(), password, role: role as any })
        if (error) return error.message ?? "Couldn't add the user."
        toast.success(`${name.trim()} can now sign in.`)
        onDone()
        return null
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new-name">Name</Label>
        <Input id="new-name" required value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-email">Email</Label>
        <Input id="new-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Temporary password</Label>
        <Input id="new-password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground">At least 8 characters. Shown here so you can pass it on.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-role">Role</Label>
        <RoleSelect id="new-role" value={role} onChange={setRole} />
      </div>
    </FormDialog>
  )
}

function EditUserDialog({ user, onOpenChange, onDone }: { user: HouseholdUser, onOpenChange: (open: boolean) => void, onDone: () => void }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<Role>(user.role === 'admin' ? 'admin' : 'member')

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Edit ${user.name}`}
      submitLabel="Save"
      onSubmit={async () => {
        if (name.trim() !== user.name || email.trim() !== user.email) {
          const { error } = await authClient.admin.updateUser({ userId: user.id, data: { name: name.trim(), email: email.trim().toLowerCase() } })
          if (error) return error.message ?? "Couldn't save the changes."
        }
        if (role !== (user.role ?? 'member')) {
          const { error } = await authClient.admin.setRole({ userId: user.id, role: role as any })
          if (error) return error.message ?? "Couldn't change the role."
        }
        toast.success(`${name.trim()} updated.`)
        onDone()
        return null
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" required value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input id="edit-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <p className="text-xs text-muted-foreground">They sign in with this.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-role">Role</Label>
        <RoleSelect id="edit-role" value={role} onChange={setRole} />
      </div>
    </FormDialog>
  )
}

function ResetPasswordDialog({ user, onOpenChange }: { user: HouseholdUser, onOpenChange: (open: boolean) => void }) {
  const [password, setPassword] = useState('')

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Reset password for ${user.name}`}
      description="Sets a new temporary password and signs them out everywhere. Pass it on so they can sign in and change it."
      submitLabel="Reset password"
      onSubmit={async () => {
        const { error } = await authClient.admin.setUserPassword({ userId: user.id, newPassword: password })
        if (error) return error.message ?? "Couldn't reset the password."
        await authClient.admin.revokeUserSessions({ userId: user.id })
        toast.success(`Password reset for ${user.name}.`)
        return null
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="reset-password">New temporary password</Label>
        <Input id="reset-password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
    </FormDialog>
  )
}

function RemoveUserDialog({ user, onOpenChange, onDone }: { user: HouseholdUser, onOpenChange: (open: boolean) => void, onDone: () => void }) {
  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={`Remove ${user.name}?`}
      description="They'll be signed out and can no longer sign in. The budget and transactions are shared, so nothing else is deleted."
      submitLabel="Remove user"
      onSubmit={async () => {
        const { error } = await authClient.admin.removeUser({ userId: user.id })
        if (error) return error.message ?? "Couldn't remove the user."
        toast.success(`${user.name} removed.`)
        onDone()
        return null
      }}
    >
      {null}
    </FormDialog>
  )
}

type Action = { kind: 'edit' | 'password' | 'remove', user: HouseholdUser } | null

export default function ManageUsers() {
  const { user: me } = useCurrentUser()
  const { data: users, error, isLoading, mutate } = useSWR(USERS_KEY, loadUsers)
  const [adding, setAdding] = useState(false)
  const [action, setAction] = useState<Action>(null)
  const refresh = () => { mutate() }
  const close = (open: boolean) => { if (!open) setAction(null) }

  const signOutEverywhere = async (user: HouseholdUser) => {
    const { error } = await authClient.admin.revokeUserSessions({ userId: user.id })
    if (error) toast.error("Couldn't sign them out.", { description: error.message })
    else toast.success(`${user.name} was signed out on every device.`)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone here shares the same budget. Admins can also manage users and bank connections."
        actions={<Button onClick={() => setAdding(true)}><PlusIcon /> Add user</Button>}
      />

      {error
        ? <ErrorState title="Couldn't load users" error={error} onRetry={refresh} />
        : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Added</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                }
                {users?.map(user => {
                  const isMe = user.id === me?.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {user.name}{isMe && <span className="font-normal text-muted-foreground"> (you)</span>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                          </div>
                          <span className="sm:hidden"><RoleBadge role={user.role} /></span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setAction({ kind: 'edit', user })}><PencilIcon /> Edit</DropdownMenuItem>
                            {/* Your own password is changed (with the current one) under Account settings. */}
                            {!isMe &&
                              <>
                                <DropdownMenuItem onClick={() => setAction({ kind: 'password', user })}><KeyRoundIcon /> Reset password</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOutEverywhere(user)}><LogOutIcon /> Sign out everywhere</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => setAction({ kind: 'remove', user })}>
                                  <Trash2Icon /> Remove
                                </DropdownMenuItem>
                              </>
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {users?.length === 0 && <EmptyState title="No users" description="Add someone to share the budget with." />}
          </Card>
        )
      }

      <AddUserDialog open={adding} onOpenChange={setAdding} onDone={refresh} />
      {action?.kind === 'edit' && <EditUserDialog key={action.user.id} user={action.user} onOpenChange={close} onDone={refresh} />}
      {action?.kind === 'password' && <ResetPasswordDialog key={action.user.id} user={action.user} onOpenChange={close} />}
      {action?.kind === 'remove' && <RemoveUserDialog key={action.user.id} user={action.user} onOpenChange={close} onDone={refresh} />}
    </div>
  )
}
