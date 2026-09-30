"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { format } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { YYYYMMToDate } from "../helpers/helperFunctions"

interface Crumb {
  label: string
  href?: string
}

function getCrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [{ label: "Dashboard" }]

  const budgetMonth = pathname.match(/^\/budget\/(\d{4}-\d{2})$/)
  if (budgetMonth) {
    return [
      { label: "Budget" },
      { label: format(YYYYMMToDate(budgetMonth[1]), "MMMM yyyy") },
    ]
  }

  const budgetCategory = pathname.match(/^\/budget\/(\d{4}-\d{2})\/[^/]+$/)
  if (budgetCategory) {
    return [
      { label: "Budget" },
      { label: format(YYYYMMToDate(budgetCategory[1]), "MMMM yyyy"), href: `/budget/${budgetCategory[1]}` },
      { label: "Category" },
    ]
  }

  if (pathname === "/transactions/assign") {
    return [{ label: "Transactions", href: "/transactions" }, { label: "Assign categories" }]
  }

  const titles: Record<string, string> = {
    "/transactions": "Transactions",
    "/calendar": "Forecast",
    "/balance": "Balances",
    "/connect": "Accounts",
    "/upload": "Import",
    "/settings/account": "Account settings",
    "/settings/users": "Users",
  }
  return [{ label: titles[pathname] ?? "afba" }]
}

export default function AppHeader() {
  const crumbs = getCrumbs(usePathname())

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.label}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 || !crumb.href
                  ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  : <BreadcrumbLink asChild><Link href={crumb.href}>{crumb.label}</Link></BreadcrumbLink>
                }
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
