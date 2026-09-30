"use client"

import Link from "next/link"
import { ChevronsUpDownIcon, LogOutIcon, UserCogIcon, UsersIcon } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "../lib/auth-client"
import useCurrentUser from "../hooks/useCurrentUser"

export const initials = (name?: string | null) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('') || '?'

export function UserAvatar({ name }: { name?: string | null }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium">
      {initials(name)}
    </div>
  )
}

export default function UserMenu() {
  const { user, isAdmin } = useCurrentUser()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobile = () => isMobile && setOpenMobile(false)

  const signOut = async () => {
    await authClient.signOut()
    window.location.assign('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={user?.name ?? 'Account'}>
              <UserAvatar name={user?.name} />
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">{user?.name ?? '…'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "top" : "right"} align="end" className="min-w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="truncate font-medium text-foreground">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email} · {isAdmin ? 'Admin' : 'Member'}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/account" onClick={closeMobile}><UserCogIcon /> Account settings</Link>
            </DropdownMenuItem>
            {isAdmin &&
              <DropdownMenuItem asChild>
                <Link href="/settings/users" onClick={closeMobile}><UsersIcon /> Manage users</Link>
              </DropdownMenuItem>
            }
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}><LogOutIcon /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
