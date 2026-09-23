"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import useTransactions from "@/app/hooks/useTransactions"
import useCategories from "@/app/hooks/useCategories"
import { dateToYYYYMM, toCurrency } from "@/app/helpers/helperFunctions"
import Transaction from "@/app/interfaces/transaction"
import { Category } from "@/app/interfaces/categories"
import { CategoryPicker } from "@/app/components/common/CategoryPicker"
import AmazonOrderLink from "@/app/components/transactions/AmazonOrderLink"

type Decision =
  | { type: 'assigned'; category: Category | undefined }
  | { type: 'skipped' }

export default function AssignQueue() {
  const { data, upsertRecord } = useTransactions({ needsCategory: 'true' })
  const [queue, setQueue] = useState<Transaction[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map())
  const [categoryDate, setCategoryDate] = useState('')

  // Snapshot the filtered list once so the session's order/length doesn't
  // shift under the user as upsertRecord optimistically mutates the same
  // SWR-backed list this data came from.
  useEffect(() => {
    if (queue === null && data) setQueue(data)
  }, [queue, data])

  const currentTransaction = queue?.[currentIndex]

  useEffect(() => {
    if (!currentTransaction?.date) return
    setCategoryDate(dateToYYYYMM(new Date(currentTransaction.date)))
  }, [currentIndex, currentTransaction?.date])

  const { data: categories } = useCategories(
    categoryDate ? { date: categoryDate } : undefined
  )

  const handleAssign = async (category: Category | undefined) => {
    if (!currentTransaction) return
    const id = String(currentTransaction._id)
    const updated: Transaction = {
      ...currentTransaction,
      userCategory: category ?? undefined,
      categorySource: 'manual',
      categoryConfirmed: true,
    }
    await upsertRecord(updated)
    setDecisions(prev => new Map(prev).set(id, { type: 'assigned', category }))
    setCurrentIndex(i => i + 1)
  }

  const handleConfirm = async () => {
    if (!currentTransaction) return
    const id = String(currentTransaction._id)
    const updated: Transaction = {
      ...currentTransaction,
      categoryConfirmed: true,
    }
    await upsertRecord(updated)
    setDecisions(prev => new Map(prev).set(id, { type: 'assigned', category: currentTransaction.userCategory }))
    setCurrentIndex(i => i + 1)
  }

  const handleSkip = () => {
    if (!currentTransaction || !queue || currentIndex >= queue.length) return
    const id = String(currentTransaction._id)
    setDecisions(prev => new Map(prev).set(id, { type: 'skipped' }))
    setCurrentIndex(i => i + 1)
  }

  const handleBack = () => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  const handleReviewSkipped = () => {
    if (!queue) return
    const skipped = queue.filter(t => decisions.get(String(t._id))?.type === 'skipped')
    setQueue(skipped)
    setCurrentIndex(0)
  }

  // Capture phase so this always sees the keystroke first, regardless of
  // which element inside the card currently has focus (e.g. the category
  // search input).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!queue || currentIndex >= queue.length) return
      if (e.key === '[') {
        e.preventDefault()
        handleBack()
      } else if (e.key === ']') {
        e.preventDefault()
        handleSkip()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [queue, currentIndex, decisions])

  if (queue === null) {
    return <div className="m-4 text-muted-foreground">Loading…</div>
  }

  if (currentIndex >= queue.length) {
    const assignedCount = [...decisions.values()].filter(d => d.type === 'assigned').length
    const skippedCount = [...decisions.values()].filter(d => d.type === 'skipped').length

    return (
      <div className="m-4 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-xl">All caught up</div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-muted-foreground">
              Assigned {assignedCount} · Skipped {skippedCount}
            </div>
            <div className="flex gap-2">
              <Link href="/transactions" className="flex-1">
                <Button variant="outline" className="w-full">Back to Transactions</Button>
              </Link>
              {skippedCount > 0 && (
                <Button className="flex-1" onClick={handleReviewSkipped}>
                  Review skipped ({skippedCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const transaction = queue[currentIndex]
  const transactionId = String(transaction._id)
  const decision = decisions.get(transactionId)
  const currentValue = decision?.type === 'assigned' ? decision.category : transaction.userCategory
  const description = transaction.merchant_name || transaction.name
  const isAmazon = transaction.merchant_name?.toLowerCase() === 'amazon'
  // Auto-suggested and not yet reviewed this session - same condition
  // UserCategoryCell/UserCategorySelector use on the transactions table.
  const needsReview = decision?.type !== 'assigned'
    && transaction.categorySource === 'auto'
    && !transaction.categoryConfirmed
  // `transaction` is the frozen queue snapshot - if a category was already
  // assigned this session (e.g. the user hit Back to revisit it), reflect
  // that here so AmazonOrderLink's save doesn't overwrite it with stale data.
  const displayTransaction: Transaction = decision?.type === 'assigned'
    ? { ...transaction, userCategory: decision.category, categorySource: 'manual', categoryConfirmed: true }
    : transaction

  return (
    <div className="m-4 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentIndex + 1} of {queue.length}</span>
            <span className="hidden md:inline">Enter to assign · Esc to skip · [ / ] to navigate</span>
          </div>
          <Progress value={((currentIndex + 1) / queue.length) * 100} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{description}</div>
              {isAmazon && <AmazonOrderLink transaction={displayTransaction} />}
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{transaction.date}</span>
              <span>{toCurrency(transaction.amount ?? 0)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Category</div>
              {currentValue && (
                needsReview ? (
                  <Badge variant="secondary" className="gap-1">
                    <TriangleAlert className="h-3 w-3" />
                    {currentValue.name}
                  </Badge>
                ) : (
                  <Badge>{currentValue.name}</Badge>
                )
              )}
            </div>
            {needsReview && (
              <div className="text-sm text-muted-foreground">
                Auto-assigned - press Enter to confirm, or search to change it.
              </div>
            )}
            {categoryDate && (
              // Keyed on the transaction so React remounts a fresh search box
              // (and its native autoFocus) every time the card advances,
              // instead of reusing the same input across transactions.
              <CategoryPicker
                key={transactionId}
                options={categories ?? []}
                value={currentValue}
                date={categoryDate}
                autoFocus
                needsReview={needsReview}
                onSelectionChange={handleAssign}
                onMonthChange={setCategoryDate}
                onConfirm={handleConfirm}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleBack}
              disabled={currentIndex === 0}
            >
              Back
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
