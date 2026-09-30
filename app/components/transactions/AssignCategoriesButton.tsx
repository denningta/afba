'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useTransactionCount from "@/app/hooks/useTransactionCount"

export default function AssignCategoriesButton() {
  const { count = 0 } = useTransactionCount({ needsCategory: 'true' })

  if (count === 0) return null

  return (
    <Link href="/transactions/assign">
      <Button variant="outline">
        Assign Categories
        <Badge>{count}</Badge>
      </Button>
    </Link>
  )
}
