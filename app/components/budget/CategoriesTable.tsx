'use client'

import { actualAmount, CompareOptions, getCategoryColumns } from "./CategoriesColDefs";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import { getPrevMonth, toCurrency, YYYYMMToDate } from "@/app/helpers/helperFunctions";
import { CopyBudgetDialog } from "./CopyBudgetDialog";
import CategoryDialog from "./CategoryDialog";
import { DataTable } from "../common/DataTable/DataTable";
import { useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { OnChangeFn, VisibilityState } from "@tanstack/react-table";
import CompareToggle, { useCompareToLastMonth } from "./CompareToggle";
import MissingFromLastMonth from "./MissingFromLastMonth";
import BudgetInput from "./BudgetInput";
import { budgetFromActual, budgetFromAmount, categoryKey, result, useLastMonthComparison } from "./lastMonth";
import { cn } from "@/lib/utils";
import useCategoryAverages, { AVERAGE_MONTHS } from "@/app/hooks/useCategoryAverages";
import { CategoryAverage } from "@/app/interfaces/categoryAverages";
import BudgetNavigator from "./BudgetNavigator";
import BudgetAccountsPicker from "./BudgetAccountsPicker";
import PageHeader from "../common/PageHeader";
import BudgetKpiCards from "./BudgetKpiCards";
import { Category } from "@/app/interfaces/categories";
import useColumnVisibility from "@/app/hooks/useColumnVisibility";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryProgressRow from "./CategoryProgressRow";
import CategoryActions from "./CategoryActions";
import { EmptyState, ErrorState } from "../common/StateMessage";

// The month is already in the page header; Type is implied by the section.
const DEFAULT_COLUMN_VISIBILITY = {
  date: false,
  type: false,
}

const totals = (rows: Category[]) => ({
  budget: rows.reduce((sum, c) => sum + (c.budget ?? 0), 0),
  actual: rows.reduce((sum, c) => sum + actualAmount(c), 0),
})

// Last month's totals for the same kind of category, e.g. "Aug: $X of $Y".
function LastMonthTotals({ rows, label }: { rows?: Category[], label: string }) {
  if (!rows) return null
  const { actual, budget } = totals(rows)
  return <span>{label}: {toCurrency(actual)} of {toCurrency(budget)}</span>
}

function SectionHeading({ title, rows, lastMonthRows, lastMonthLabel }: { title: string, rows: Category[], lastMonthRows?: Category[], lastMonthLabel: string }) {
  const { budget, actual } = totals(rows)

  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="flex gap-4 text-sm tabular-nums text-muted-foreground">
        <LastMonthTotals rows={lastMonthRows} label={lastMonthLabel} />
        <span>{toCurrency(actual)} of {toCurrency(budget)}</span>
      </span>
    </div>
  )
}

// Phone version of the compare columns, under a category's progress row.
function MobileCompareLine({ category, compare }: { category: Category, compare: CompareOptions }) {
  const previous = compare.lastMonth.get(category)
  const outcome = previous && result(previous)
  const avg = compare.average?.(category)
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="min-w-0 flex-1 text-xs tabular-nums text-muted-foreground">
        {previous && outcome ? (
          <>
            {compare.lastMonthLabel}:{' '}
            <button
              type="button"
              className="underline decoration-dotted underline-offset-2"
              onClick={() => compare.setBudget(category, budgetFromActual(previous))}
              aria-label={`Use ${compare.lastMonthLabel}'s actual as the budget`}
            >
              {toCurrency(actualAmount(previous))}
            </button>
            {' '}of {toCurrency(previous.budget ?? 0)} ·{' '}
            <span className={cn("whitespace-nowrap", outcome.amount > 0 && "text-positive", outcome.amount < 0 && "text-negative")}>{outcome.label}</span>
          </>
        ) : `Not in ${compare.lastMonthLabel}`}
        {avg &&
          <div>
            {compare.averageLabel}:{' '}
            <button
              type="button"
              className="underline decoration-dotted underline-offset-2"
              onClick={() => compare.setBudget(category, budgetFromAmount(avg.average))}
              aria-label={`Use the ${compare.averageLabel} as the budget`}
            >
              {toCurrency(avg.average)}
            </button>
          </div>
        }
      </div>
      <BudgetInput
        key={category.budget ?? 0}
        value={category.budget}
        label={`${compare.thisMonthLabel} budget for ${category.name}`}
        onSave={budget => compare.setBudget(category, budget)}
        className="w-28 shrink-0"
      />
    </div>
  )
}

// Phone layout: the Top-categories style list (name, actual / budget, bar)
// in place of the table, keeping each row's actions menu.
function MobileSection({ title, rows, isLoading, compare, lastMonthRows }: {
  title: string
  rows: Category[]
  isLoading?: boolean
  compare?: CompareOptions
  lastMonthRows?: Category[]
}) {
  const { budget, actual } = totals(rows)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-3 tabular-nums">
          <span>{toCurrency(actual)} of {toCurrency(budget)}</span>
          {compare && <LastMonthTotals rows={lastMonthRows} label={compare.lastMonthLabel} />}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        {!isLoading && rows.length === 0 &&
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        }
        {rows.map((category, i) => (
          <div key={category._id?.toString() ?? `${category.name}-${i}`}>
            <CategoryProgressRow
              category={category}
              link
              action={<CategoryActions category={category} />}
            />
            {compare && <MobileCompareLine category={category} compare={compare} />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function CategoriesTable() {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const { data, isLoading, error, mutate, upsertRecord } = useCategories({ date: currentDate })
  // One saved column choice drives both tables, so a toggle in Expenses'
  // View menu updates Income immediately.
  const [savedVisibility, setSavedVisibility] = useColumnVisibility('afba:budget-columns', DEFAULT_COLUMN_VISIBILITY)

  // Last month's numbers beside this month's, for planning the budget.
  const [compareOn, setCompareOn] = useCompareToLastMonth()
  const months = useMemo(() => {
    if (!currentDate || !/^\d{4}-\d{2}$/.test(currentDate)) return null
    const previous = getPrevMonth(currentDate, 1)
    return {
      previous,
      lastMonthLabel: format(YYYYMMToDate(previous), 'MMM'),
      thisMonthLabel: format(YYYYMMToDate(currentDate), 'MMM'),
    }
  }, [currentDate])
  const { data: lastMonthData } = useCategories({ date: months?.previous }, { enabled: compareOn && !!months })
  const lastMonth = useLastMonthComparison(data, lastMonthData)
  const { data: averages } = useCategoryAverages(currentDate, compareOn && !!months)
  const averageOf = useMemo(() => {
    if (!averages) return undefined
    const byName = new Map<string, CategoryAverage>(averages.averages.map(avg => [categoryKey(avg), avg]))
    return (category: Category) => byName.get(categoryKey(category))
  }, [averages])
  const averageRange = averages?.months.length
    ? `${format(YYYYMMToDate(averages.months[0]), 'MMM')}–${format(YYYYMMToDate(averages.months[averages.months.length - 1]), 'MMM yyyy')}`
    : ''

  const setBudget = useCallback(
    (category: Category, budget: number) => upsertRecord({ ...category, budget }),
    [upsertRecord]
  )

  const compare: CompareOptions | undefined = useMemo(() => (
    compareOn && months && lastMonthData
      ? {
        lastMonth,
        lastMonthLabel: months.lastMonthLabel,
        thisMonthLabel: months.thisMonthLabel,
        setBudget,
        average: averageOf,
        averageLabel: `${AVERAGE_MONTHS}-mo avg`,
        averageRange,
      }
      : undefined
  ), [compareOn, months, lastMonthData, lastMonth, setBudget, averageOf, averageRange])

  const columns = useMemo(() => getCategoryColumns(compare), [compare])

  // Progress tracks this month's spending, mostly empty while planning, so it
  // makes room for the compare columns without changing the saved choice.
  const columnVisibility = useMemo(
    () => compare ? { ...savedVisibility, progress: false } : savedVisibility,
    [compare, savedVisibility]
  )
  const setColumnVisibility: OnChangeFn<VisibilityState> = updater => setSavedVisibility(saved => {
    const next = typeof updater === 'function' ? updater(compare ? { ...saved, progress: false } : saved) : updater
    return compare ? { ...next, progress: saved.progress ?? true } : next
  })

  // Adds last month's categories to this month with last month's budget.
  const addFromLastMonth = async (categories: Category[]) => {
    const results = await Promise.allSettled(categories.map(({ name, type, budget }) =>
      axios.post('/api/category', { name, type, budget: budget ?? 0, date: currentDate })
    ))
    await mutate()
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed) toast.error(`Couldn't add ${failed} of ${categories.length} categories.`)
    else toast.success(categories.length === 1 ? `Added ${categories[0].name}.` : `Added ${categories.length} categories.`)
  }

  const split = (rows: Category[] | undefined) => ({
    income: (rows ?? []).filter(c => c.type === 'income'),
    expenses: (rows ?? []).filter(c => c.type !== 'income'),
  })
  const { income, expenses } = useMemo(() => split(data), [data])
  const lastMonthRows = useMemo(() => compare ? split(lastMonthData) : undefined, [compare, lastMonthData])
  const missing = useMemo(() => split(lastMonth.missing), [lastMonth])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Budget"
        actions={
          <>
            <BudgetNavigator />
            {months &&
              <CompareToggle checked={compareOn} onCheckedChange={setCompareOn} lastMonthLabel={months.lastMonthLabel} />
            }
            <BudgetAccountsPicker />
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState title="Couldn't load this budget" error={error} onRetry={() => mutate()} />
        </Card>
      ) : !isLoading && data?.length === 0 ? (
        <div className="space-y-4">
          <Card>
            <EmptyState
              title="No budget for this month yet"
              description="Add categories one at a time, or copy them from a month you've already planned."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <CategoryDialog category={{ date: currentDate }} />
                  <CopyBudgetDialog />
                </div>
              }
            />
          </Card>
          {compare &&
            <div className="grid gap-4 md:grid-cols-2">
              <MissingFromLastMonth categories={missing.income} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />
              <MissingFromLastMonth categories={missing.expenses} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />
            </div>
          }
        </div>
      ) : (
        <>
          <BudgetKpiCards data={data} isLoading={isLoading} month={currentDate ?? ""} />

          <div className="space-y-4 md:hidden">
            <div className="grid grid-cols-2 gap-2 [&_button]:w-full">
              <CategoryDialog category={{ date: currentDate }} />
              <CopyBudgetDialog />
            </div>
            <MobileSection title="Income" rows={income} isLoading={isLoading} compare={compare} lastMonthRows={lastMonthRows?.income} />
            {compare && <MissingFromLastMonth categories={missing.income} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />}
            <MobileSection title="Expenses" rows={expenses} isLoading={isLoading} compare={compare} lastMonthRows={lastMonthRows?.expenses} />
            {compare && <MissingFromLastMonth categories={missing.expenses} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />}
          </div>

          <section className="hidden space-y-3 md:block">
            <SectionHeading title="Income" rows={income} lastMonthRows={lastMonthRows?.income} lastMonthLabel={months?.lastMonthLabel ?? ''} />
            <DataTable
              variant="minimal"
              data={income}
              columns={columns}
              isLoading={isLoading}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              emptyState={<EmptyState title="No income categories" description="Add one to plan this month's income." />}
            />
            {compare && <MissingFromLastMonth categories={missing.income} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />}
          </section>

          <section className="hidden space-y-3 md:block">
            <SectionHeading title="Expenses" rows={expenses} lastMonthRows={lastMonthRows?.expenses} lastMonthLabel={months?.lastMonthLabel ?? ''} />
            <DataTable
              data={expenses}
              columns={columns}
              isLoading={isLoading}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              emptyState={<EmptyState title="No expense categories" description="Add one to start budgeting spending." />}
              toolbarActions={
                <>
                  <CategoryDialog category={{ date: currentDate }} />
                  <CopyBudgetDialog />
                </>
              }
            />
            {compare && <MissingFromLastMonth categories={missing.expenses} onAdd={addFromLastMonth} lastMonthLabel={compare.lastMonthLabel} thisMonthLabel={compare.thisMonthLabel} />}
          </section>
        </>
      )}
    </div>
  )
}
