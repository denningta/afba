'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactElement } from "react"

export interface NavItemProps {
  icon: ReactElement
  title: string
  href?: string
}

export default function NavItem({ icon, title, href = '' }: NavItemProps) {
  const pathname = usePathname()

  return (
    <Link href={href}>
      <div className="flex items-center justify-center aspect-square has-tooltip">
        <span className="tooltip left-24 rounded shadow-lg px-4 py-2 text-sm bg-opacity-80 backdrop-blur border-muted">
          {title}
        </span>
        {icon}
        {pathname === href && <div className="h-6 w-2 bg-white absolute right-0 rounded-l" />}
      </div>
    </Link>
  )
}
