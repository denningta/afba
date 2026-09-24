"use client"

import { useEffect, useState } from "react"
import { RiHomeFill, RiMoneyDollarCircleFill, RiPieChartFill, RiUploadCloudFill, RiUploadFill, RiLineChartFill, RemixiconComponentType } from "@remixicon/react"
import NavItem from "./NavItem"
import { ThemeToggle } from "./common/ThemeToggle"
import { CalendarIcon, CalendarX, MenuIcon, PlugIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import Link from "next/link"

export interface NavItemData {
  title: string
  icon: React.ReactElement
  href: string
}

const navItems: NavItemData[] = [
  {
    title: "Home",
    icon: <RiHomeFill />,
    href: "/"
  },
  {
    title: "Transactions",
    icon: <RiMoneyDollarCircleFill />,
    href: "/transactions"
  },
  {
    title: "Calendar",
    icon: <CalendarIcon />,
    href: "/calendar"

  },
  {
    title: "Balance",
    icon: <RiLineChartFill />,
    href: "/balance"
  },
  {
    title: "Connect",
    icon: <PlugIcon />,
    href: "/connect"
  }
]

export default function Sidebar() {
  // Radix/Vaul assign the trigger a useId()-based aria-controls value, and
  // this early in the tree (right after ThemeProvider's own script insertion)
  // that count can drift between the server render and the client's first
  // pass, causing a hydration mismatch on this specific button. Rendering a
  // plain, non-interactive placeholder (visually identical) during SSR and
  // swapping in the real Drawer-driven trigger only after mount sidesteps
  // that entirely - same pattern DataTable.tsx already uses elsewhere.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      {/* Mobile top bar: fixed (not absolute) so it never scrolls out of reach,
          with its own reserved height (see the pt-16 on the content wrapper in
          app/layout.tsx) so it never overlaps page content underneath it.
          The safe-area padding lives on this OUTER div (which has no fixed
          height, so it just grows) - putting it on the same element as the
          h-14 bar below would eat into that fixed height on notched phones
          and push the button out of the visible box. */}
      <div
        className="fixed inset-x-0 top-0 z-40 border-b bg-background md:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-sm font-medium">afba</span>
          {mounted ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Navigation</DrawerTitle>
                  <DrawerDescription>Links to the main pages of the app.</DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col items-center space-y-8 p-10">
                  {navItems.map((navItem, i) => (
                    <Link href={navItem.href} key={i}>
                      <Button variant="ghost" size="lg">
                        <div className="flex items-center space-x-4">
                          <span> {navItem.icon} </span>
                          <span>{navItem.title}</span>
                        </div>
                      </Button>
                    </Link>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Button variant="ghost" size="icon" disabled>
              <MenuIcon />
            </Button>
          )}
        </div>
      </div>
      <aside className="fixed top-0 left-0 h-screen w-20 z-40 hidden md:flex flex-col space-y-4 bg-tremor-brand dark:bg-dark-tremor-brand">
        <div className="h-full flex flex-col items-center space-y-14 pt-20 pb-10 bg-accent">
          {navItems.map((navItem, i) => (
            <NavItem
              key={i}
              title={navItem.title}
              icon={navItem.icon}
              href={navItem.href}
            />
          ))}
          {/* <NavItem title="Home" icon={<RiHomeFill />} href="/" /> */}
          {/* <NavItem title="Transactions" icon={<RiMoneyDollarCircleFill />} href="/transactions" /> */}
          {/* <NavItem title="Calendar" icon={<CalendarIcon />} href="/calendar" /> */}
          {/* <NavItem title="Balance" icon={<RiLineChartFill />} href="/balance" /> */}
          {/* <NavItem title="Connect" icon={<PlugIcon />} href="/connect" /> */}
          <div className="grow"></div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
