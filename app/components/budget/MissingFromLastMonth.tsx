'use client'

import { useState } from "react"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { Category } from "@/app/interfaces/categories"
import { actualAmount } from "./amounts"
import { categoryKey } from "./lastMonth"

// Last month's categories this month doesn't have yet, each one click away.
export default function MissingFromLastMonth({ categories, lastMonthLabel, thisMonthLabel, onAdd }: {
  categories: Category[]
  lastMonthLabel: string
  thisMonthLabel: string
  onAdd: (categories: Category[]) => Promise<unknown>
}) {
  const [adding, setAdding] = useState<Set<string>>(new Set())
  if (!categories.length) return null

  const add = async (toAdd: Category[]) => {
    setAdding(new Set(toAdd.map(categoryKey)))
    try {
      await onAdd(toAdd)
    } finally {
      setAdding(new Set())
    }
  }

  return (
    <Card size="sm" className="bg-muted/30">
      <CardHeader>
        <CardTitle>From {lastMonthLabel}</CardTitle>
        <CardDescription>Not in the {thisMonthLabel} budget yet. Adding uses {lastMonthLabel}&apos;s budget.</CardDescription>
        {categories.length > 1 &&
          <CardAction>
            <Button variant="outline" size="sm" disabled={adding.size > 0} onClick={() => add(categories)}>
              <PlusIcon /> Add all ({categories.length})
            </Button>
          </CardAction>
        }
      </CardHeader>
      <CardContent className="divide-y">
        {categories.map(category => (
          <div key={categoryKey(category)} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{category.name}</div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {lastMonthLabel}: {toCurrency(actualAmount(category))} of {toCurrency(category.budget ?? 0)}
              </div>
            </div>
            <Button variant="ghost" size="sm" disabled={adding.size > 0} onClick={() => add([category])}>
              {adding.has(categoryKey(category)) ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
              Add
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
