'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useTransactions from "@/app/hooks/useTransactions"

export default function AssignCategoriesButton() {
  const { data } = useTransactions({ needsCategory: 'true' })
  const count = data?.length ?? 0

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
