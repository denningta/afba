"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Info, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import useTransactions from "@/app/hooks/useTransactions"
import useCategories from "@/app/hooks/useCategories"
import { dateToYYYYMM, formatShortDate } from "@/app/helpers/helperFunctions"
import Transaction, { transactionLabel } from "@/app/interfaces/transaction"
import { Category } from "@/app/interfaces/categories"
import { CategoryPicker } from "@/app/components/common/CategoryPicker"
import AmazonOrderLink from "@/app/components/transactions/AmazonOrderLink"
import { TransactionDetailsDialog } from "@/app/components/transactions/TransactionActions"
import { Amount, MerchantLogo } from "@/app/components/transactions/TransactionCells"
import PageHeader from "@/app/components/common/PageHeader"
import { EmptyState, ErrorState } from "@/app/components/common/StateMessage"
import { Skeleton } from "@/components/ui/skeleton"

type Decision =
  | { type: 'assigned'; category: Category | undefined }
  | { type: 'skipped' }

export default function AssignQueue() {
  const { data, setCategory, error, mutate } = useTransactions({ needsCategory: 'true' })
  const [queue, setQueue] = useState<Transaction[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map())
  const [categoryDate, setCategoryDate] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Auto-focusing the search box is great on desktop (no on-screen keyboard
  // to fight with), but on mobile it pops the keyboard up over half the
  // screen the instant a new transaction loads, before the user has even
  // read it - only autofocus on viewports wide enough not to have that
  // problem (matches the md: breakpoint used everywhere else for this).
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

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
    await setCategory(currentTransaction, category)
    setDecisions(prev => new Map(prev).set(id, { type: 'assigned', category }))
    setCurrentIndex(i => i + 1)
  }

  const handleConfirm = async () => {
    if (!currentTransaction) return
    const id = String(currentTransaction._id)
    await setCategory(currentTransaction, currentTransaction.userCategory, { confirm: true })
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
      // Let the details dialog handle its own Escape-to-close instead of
      // also skipping the transaction underneath it.
      if (detailsOpen) return
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
  }, [queue, currentIndex, decisions, detailsOpen])

  // Don't carry an open details dialog over to the next transaction.
  useEffect(() => {
    setDetailsOpen(false)
  }, [currentIndex])

  if (error && queue === null) {
    return (
      <Shell>
        <Card><ErrorState title="Couldn't load transactions" error={error} onRetry={() => mutate()} /></Card>
      </Shell>
    )
  }

  if (queue === null) {
    return (
      <Shell>
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </Shell>
    )
  }

  if (currentIndex >= queue.length) {
    const assignedCount = [...decisions.values()].filter(d => d.type === 'assigned').length
    const skippedCount = [...decisions.values()].filter(d => d.type === 'skipped').length

    return (
      <Shell>
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title={queue.length === 0 ? "Nothing to assign" : "All caught up"}
            description={queue.length === 0
              ? "Every transaction already has a category."
              : `Assigned ${assignedCount} · Skipped ${skippedCount}`}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/transactions">Back to Transactions</Link>
                </Button>
                {skippedCount > 0 && (
                  <Button onClick={handleReviewSkipped}>
                    Review skipped ({skippedCount})
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      </Shell>
    )
  }

  const transaction = queue[currentIndex]
  const transactionId = String(transaction._id)
  const decision = decisions.get(transactionId)
  const currentValue = decision?.type === 'assigned' ? decision.category : transaction.userCategory
  const description = transactionLabel(transaction)
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
    <Shell>
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="tabular-nums">{currentIndex + 1} of {queue.length}</span>
            <span className="hidden items-center gap-1 text-xs md:flex">
              <Kbd>Enter</Kbd> assign <Kbd>Esc</Kbd> skip <Kbd>[</Kbd><Kbd>]</Kbd> navigate
            </span>
          </div>
          <Progress className="h-1.5" value={((currentIndex + 1) / queue.length) * 100} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <MerchantLogo src={transaction.logo_url} name={description} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-medium leading-tight" title={description}>{description}</div>
              <div className="truncate text-sm text-muted-foreground">
                {formatShortDate(transaction.date)}
                {transaction.merchant_name && transaction.name !== transaction.merchant_name && ` · ${transaction.name}`}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Amount value={transaction.amount ?? 0} className="text-lg" />
              {isAmazon && <AmazonOrderLink transaction={displayTransaction} />}
              <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground" title="View all transaction details" aria-label="Transaction details">
                    <Info />
                  </Button>
                </DialogTrigger>
                <TransactionDetailsDialog
                  transaction={displayTransaction}
                  onClose={() => setDetailsOpen(false)}
                />
              </Dialog>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Category</div>
              {currentValue && (
                needsReview ? (
                  <Badge
                    variant="outline"
                    className="cursor-pointer gap-1 border-warning/50 bg-warning/10"
                    role="button"
                    tabIndex={0}
                    onClick={handleConfirm}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleConfirm()
                      }
                    }}
                    title="Tap to confirm this category"
                  >
                    <TriangleAlert className="size-3 text-warning" />
                    {currentValue.name}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{currentValue.name}</Badge>
                )
              )}
            </div>
            {needsReview && (
              <div className="text-sm text-muted-foreground">
                Auto-assigned - tap the badge or press Enter to confirm, or search to change it.
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
                autoFocus={isDesktop}
                needsReview={needsReview}
                onSelectionChange={handleAssign}
                onMonthChange={setCategoryDate}
                onConfirm={handleConfirm}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
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
    </Shell>
  )
}

// Page header plus a centered, readable-width column for the queue card.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Assign categories"
        description="Review transactions that still need a category, one at a time."
      />
      {children}
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">{children}</kbd>
  )
}
