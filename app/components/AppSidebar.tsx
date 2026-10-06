"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import {
  ArrowLeftRightIcon,
  CalendarClockIcon,
  ChartColumnIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MonitorIcon,
  MoonIcon,
  RefreshCwIcon,
  SparklesIcon,
  SunIcon,
  TriangleAlertIcon,
  UploadIcon,
  WalletIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useTransactionCount from "../hooks/useTransactionCount"
import useAccounts from "../hooks/useAccounts"
import useSyncTransactions from "../hooks/useSyncTransactions"
import useSWR from "swr"
import { formatDistanceToNowStrict } from "date-fns"
import type { SyncStatus } from "../lib/syncTransactions"
import fetcher from "../lib/fetcher"
import { dateToYYYYMM } from "../helpers/helperFunctions"
import UserMenu from "./UserMenu"

interface NavLink {
  title: string
  href: string
  icon: React.ComponentType
  isActive: (pathname: string) => boolean
}

const mainNav: NavLink[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboardIcon, isActive: p => p === "/" },
  // href is filled in at render time with the current month.
  { title: "Budget", href: "/budget/", icon: WalletIcon, isActive: p => p.startsWith("/budget/") },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRightIcon, isActive: p => p.startsWith("/transactions") },
  { title: "Forecast", href: "/calendar", icon: CalendarClockIcon, isActive: p => p.startsWith("/calendar") },
  { title: "Balances", href: "/balance", icon: LineChartIcon, isActive: p => p.startsWith("/balance") },
  { title: "Spending", href: "/spending", icon: ChartColumnIcon, isActive: p => p.startsWith("/spending") },
  { title: "Assistant", href: "/assistant", icon: SparklesIcon, isActive: p => p.startsWith("/assistant") },
]

const manageNav: NavLink[] = [
  { title: "Accounts", href: "/connect", icon: LandmarkIcon, isActive: p => p.startsWith("/connect") },
  { title: "Import", href: "/upload", icon: UploadIcon, isActive: p => p.startsWith("/upload") },
]

function NavGroup({ label, items, badges = {} }: { label: string, items: NavLink[], badges?: Record<string, number> }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map(item => {
            const href = item.title === "Budget" ? `/budget/${dateToYYYYMM(new Date())}` : item.href
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive(pathname)} tooltip={item.title}>
                  <Link href={href} onClick={() => isMobile && setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {!!badges[item.title] &&
                  <SidebarMenuBadge>{badges[item.title]}</SidebarMenuBadge>
                }
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// "just now" under a minute, else "5 minutes ago", "2 hours ago", ...
const syncedAgo = (date: string | Date) => {
  const ms = Date.now() - new Date(date).getTime()
  return ms < 60_000 ? 'just now' : `${formatDistanceToNowStrict(new Date(date))} ago`
}

function SyncAllButton() {
  const { data: accounts } = useAccounts()
  const { syncAll, loading } = useSyncTransactions()
  // Re-read every minute so "Synced … ago" stays current and background
  // syncs show up without a reload.
  const { data: status } = useSWR<SyncStatus | null>('/api/transactions/sync/status', fetcher, { refreshInterval: 60_000 })
  const failures = status?.failures ?? []
  const detail = loading ? 'Syncing…' : status ? `Synced ${syncedAgo(status.lastRunAt)}` : 'Never synced'

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip={`Sync all accounts · ${detail}`}
          disabled={loading || !accounts}
          onClick={() => syncAll()}
        >
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
          <div className="grid min-w-0 leading-tight">
            <span className="truncate">Sync all accounts</span>
            <span className="truncate text-xs text-muted-foreground">{detail}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {failures.length > 0 &&
        <SidebarMenuItem>
          <SidebarMenuButton asChild
            tooltip={`Sync failed: ${failures.map(f => `${f.accountName} (${f.message})`).join(', ')}`}
            className="text-warning hover:text-warning">
            <Link href="/connect">
              <TriangleAlertIcon />
              <span>{failures.length === 1 ? `${failures[0].accountName} didn't sync` : `${failures.length} accounts didn't sync`}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      }
    </>
  )
}

function ThemeMenu() {
  const { setTheme } = useTheme()

  return (
    <SidebarMenu className="gap-1">
      <SyncAllButton />
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip="Theme">
              <SunIcon className="dark:hidden" />
              <MoonIcon className="hidden dark:block" />
              <span>Theme</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}><SunIcon /> Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}><MoonIcon /> Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}><MonitorIcon /> System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default function AppSidebar() {
  // Transactions still waiting for a category, surfaced as a nav badge.
  const { count: needsCategory, refresh: refreshNeedsCategory } = useTransactionCount({ needsCategory: 'true' })
  // The sidebar never remounts, so also re-check whenever the page changes.
  const pathname = usePathname()
  useEffect(() => {
    refreshNeedsCategory()
  }, [pathname, refreshNeedsCategory])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                  a
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold">afba</span>
                  <span className="text-xs text-muted-foreground">Budgeting</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Overview" items={mainNav} badges={{ Transactions: needsCategory ?? 0 }} />
        <NavGroup label="Manage" items={manageNav} />
      </SidebarContent>
      <SidebarFooter>
        <ThemeMenu />
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
