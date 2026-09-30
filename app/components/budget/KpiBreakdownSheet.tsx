'use client'

import Link from "next/link"
import { format } from "date-fns"
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"
import { BreakdownGroup, BreakdownTransaction } from "@/app/interfaces/budgetBreakdown"
import { categoryTransactionsHref, dateToYYYYMM, formatShortDate, parseDisplayDate, toCurrency, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import useBudgetBreakdown from "@/app/hooks/useBudgetBreakdown"
import ExplainSheet, { ExplainSection, ReconcileRow, Term } from "../common/ExplainSheet"
import { ErrorState } from "../common/StateMessage"
import { Amount, MerchantLogo } from "../transactions/TransactionCells"
import getBudgetKpis, { KpiContributor } from "./kpis"

export type BudgetKpiKey = 'income' | 'budgeted' | 'spent' | 'leftToSpend'

export interface KpiBreakdownSheetProps {
  kpi: BudgetKpiKey | null
  onOpenChange: (open: boolean) => void
  data: Category[] | undefined
  month: string // YYYY-MM
}

interface Row {
  category: Category
  amount: number
  // Shown under the name, e.g. "Budget $400".
  secondary?: string
}

// The math and the rows behind one of the budget KPI cards, plus what the
// month's numbers leave out and why.
export default function KpiBreakdownSheet({ kpi, onOpenChange, data, month }: KpiBreakdownSheetProps) {
  const { plannedIncome, plannedBudget, plannedDiff, actualIncome, actualSpent, actualDiff } = getBudgetKpis(data)
  const leftToSpend = plannedBudget.value - actualSpent.value
  const monthLabel = format(YYYYMMToDate(month), 'MMMM yyyy')

  // Actual figures leave things out; the plan (Budgeted) is just the budgets.
  const showNotIncluded = kpi !== null && kpi !== 'budgeted'
  const { data: breakdown, error: breakdownError, isLoading: breakdownLoading } = useBudgetBreakdown(month, showNotIncluded)

  const withBudget = (c: KpiContributor, prefix = 'Budget') => ({
    category: c.category,
    amount: c.amount,
    secondary: `${prefix} ${toCurrency(c.category.budget ?? 0)}`,
  })

  let title = ''
  let description = ''
  let math: React.ReactNode = null
  let rows: Row[] = []
  let expected = 0
  let rowsTitle = ''

  switch (kpi) {
    case 'income':
      title = 'Income'
      description = `Money received in ${monthLabel} in your income categories.`
      math = <>
        <Term label="Income" value={actualIncome.value} /> received across {actualIncome.contributors.length} income
        categor{actualIncome.contributors.length === 1 ? 'y' : 'ies'}, against <Term label="planned" value={plannedIncome.value} />.
      </>
      rows = actualIncome.contributors.map(c => withBudget(c, 'Planned'))
      expected = actualIncome.value
      rowsTitle = 'Income categories'
      break
    case 'budgeted':
      title = 'Budgeted'
      description = `What you planned to spend in ${monthLabel}, summed across expense categories.`
      math = <>
        <Term label="Planned income" value={plannedIncome.value} /> − <Term label="Budgeted" value={plannedBudget.value} />
        {' = '}
        <Term
          label={plannedDiff.value >= 0 ? 'unassigned' : 'over-assigned'}
          value={Math.abs(plannedDiff.value)}
          tone={plannedDiff.value >= 0 ? undefined : 'negative'}
        />
      </>
      rows = plannedBudget.contributors.map(c => ({
        category: c.category,
        amount: c.amount,
        secondary: `Spent ${toCurrency(c.category.spent ?? 0)}`,
      }))
      expected = plannedBudget.value
      rowsTitle = 'Expense category budgets'
      break
    case 'spent':
      title = 'Spent'
      description = `Spending in ${monthLabel} in your expense categories.`
      math = <>
        <Term label="Spent" value={actualSpent.value} /> across {actualSpent.contributors.length} expense categories,
        {' '}{plannedBudget.value > 0 ? Math.round((actualSpent.value / plannedBudget.value) * 100) : 0}% of
        {' '}<Term label="budgeted" value={plannedBudget.value} />.
      </>
      rows = actualSpent.contributors.map(c => withBudget(c))
      expected = actualSpent.value
      rowsTitle = 'Expense categories'
      break
    case 'leftToSpend':
      title = 'Left to spend'
      description = `Budget still unspent in ${monthLabel}, and the month's net cash flow.`
      math = <div className="space-y-1">
        <div>
          <Term label="Budgeted" value={plannedBudget.value} /> − <Term label="Spent" value={actualSpent.value} />
          {' = '}<Term label="Left to spend" value={leftToSpend} tone={leftToSpend >= 0 ? 'positive' : 'negative'} />
        </div>
        <div>
          <Term label="Income" value={actualIncome.value} /> − <Term label="Spent" value={actualSpent.value} />
          {' = '}<Term label="Net cash flow" value={actualDiff.value} tone={actualDiff.value >= 0 ? 'positive' : 'negative'} />
        </div>
      </div>
      rows = plannedBudget.contributors.map(c => ({
        category: c.category,
        amount: (c.category.budget ?? 0) - (c.category.spent ?? 0),
        secondary: `${toCurrency(c.category.spent ?? 0)} spent of ${toCurrency(c.category.budget ?? 0)}`,
      }))
      expected = leftToSpend
      rowsTitle = 'Left in each expense category'
      break
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  const sorted = [...rows].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  const groups: { key: string, title: string, reason: string, group?: BreakdownGroup, action?: React.ReactNode }[] = breakdown ? [
    {
      key: 'uncategorized',
      title: 'Uncategorized',
      reason: 'No category yet, so they count toward nothing until assigned.',
      group: breakdown.uncategorized,
      action: <Button variant="outline" size="sm" asChild><Link href="/transactions/assign">Assign categories</Link></Button>,
    },
    {
      key: 'excludedAccounts',
      title: 'In accounts left out of the budget',
      reason: 'These accounts have "Include in budget" turned off.',
      group: breakdown.excludedAccounts,
      action: <Button variant="outline" size="sm" asChild><Link href="/connect">Manage accounts</Link></Button>,
    },
    {
      key: 'transfers',
      title: 'Transfers',
      reason: 'Assigned to transfer categories, which income and spending skip.',
      group: breakdown.transfers,
    },
    {
      key: 'otherMonth',
      title: "Counted in another month's budget",
      reason: `Dated in ${monthLabel} but assigned to a category from a different month, so they count there.`,
      group: breakdown.otherMonth,
    },
  ].filter(g => g.group && g.group.count > 0) : []

  return (
    <ExplainSheet
      open={kpi !== null}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      math={math}
    >
      <ExplainSection title={rowsTitle} description="Expand a category to see its transactions.">
        {sorted.length === 0
          ? <p className="text-sm text-muted-foreground">No categories for this month.</p>
          : <div className="divide-y divide-border/60">
            {sorted.map(row => (
              <CategoryRow
                key={String(row.category._id)}
                row={row}
                share={total !== 0 ? row.amount / total : 0}
                month={month}
              />
            ))}
          </div>
        }
        <ReconcileRow total={total} expected={expected} />
      </ExplainSection>

      {showNotIncluded &&
        <ExplainSection
          title="Not included"
          description="Transactions from this month that these numbers leave out, and why."
        >
          {breakdownError && <ErrorState className="py-4" title="Couldn't check what's left out" error={breakdownError} />}
          {breakdownLoading && <Skeleton className="h-16 w-full" />}
          {breakdown && groups.length === 0 &&
            <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              Nothing left out: every transaction dated this month is in a budget category.
            </p>
          }
          {groups.map(g => (
            <details key={g.key} className="group rounded-lg border">
              <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2">
                <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {g.title} <span className="font-normal text-muted-foreground">· {g.group!.count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{g.reason}</div>
                </div>
                <div className="shrink-0 text-right text-xs tabular-nums">
                  {g.group!.totalOut > 0 && <div>{toCurrency(g.group!.totalOut)} out</div>}
                  {g.group!.totalIn > 0 && <div className="text-positive">+{toCurrency(g.group!.totalIn)} in</div>}
                </div>
              </summary>
              <div className="space-y-2 border-t px-3 py-2">
                <TransactionList transactions={g.group!.transactions} month={month} />
                {g.group!.count > g.group!.transactions.length &&
                  <p className="text-xs text-muted-foreground">Showing {g.group!.transactions.length} of {g.group!.count}.</p>
                }
                {g.action}
              </div>
            </details>
          ))}
        </ExplainSection>
      }
    </ExplainSheet>
  )
}

function CategoryRow({ row, share, month }: { row: Row, share: number, month: string }) {
  const transactions = (row.category.transactions ?? []) as (Transaction | BreakdownTransaction)[]
  const href = row.category._id && row.category.date ? categoryTransactionsHref(row.category) : null

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-2">
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{row.category.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.secondary} · {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-medium tabular-nums">{toCurrency(row.amount)}</div>
          <div className="text-xs tabular-nums text-muted-foreground">{Math.round(share * 100)}%</div>
        </div>
      </summary>
      <div className="space-y-2 pb-3 pl-6">
        {transactions.length === 0
          ? <p className="text-xs text-muted-foreground">No transactions in this category yet.</p>
          : <TransactionList transactions={transactions} month={month} />
        }
        {href &&
          <Button variant="link" size="sm" className="h-auto px-0" asChild>
            <Link href={href}>Open category <ArrowUpRightIcon /></Link>
          </Button>
        }
      </div>
    </details>
  )
}

function TransactionList({ transactions, month }: { transactions: (Transaction | BreakdownTransaction)[], month: string }) {
  const sorted = [...transactions].sort((a, b) =>
    (parseDisplayDate(b.date)?.getTime() ?? 0) - (parseDisplayDate(a.date)?.getTime() ?? 0))

  return (
    <ul className="divide-y divide-border/60">
      {sorted.map((t, i) => {
        const merchant = t.merchant_name || t.name || 'Transaction'
        const date = parseDisplayDate(t.date)
        const otherMonth = date && dateToYYYYMM(date) !== month
        return (
          <li key={String(t._id ?? i)} className="flex items-center gap-2.5 py-1.5">
            <MerchantLogo src={t.logo_url} name={merchant} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm">{merchant}</span>
                {otherMonth &&
                  <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground" title="Dated outside this month but assigned to it">
                    Dated {formatShortDate(t.date)}
                  </Badge>
                }
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {formatShortDate(t.date)}
                {t.account?.name && ` · ${t.account.name}${t.account.mask ? ` ••${t.account.mask}` : ''}`}
              </div>
            </div>
            <Amount value={t.amount ?? 0} className="text-sm" />
          </li>
        )
      })}
    </ul>
  )
}
