'use client'

import categoryColumns, { actualAmount } from "./CategoriesColDefs";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import { toCurrency } from "@/app/helpers/helperFunctions";
import { CopyBudgetDialog } from "./CopyBudgetDialog";
import CategoryDialog from "./CategoryDialog";
import { DataTable } from "../common/DataTable/DataTable";
import { useMemo } from "react";
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

function SectionHeading({ title, rows }: { title: string, rows: Category[] }) {
  const budget = rows.reduce((sum, c) => sum + (c.budget ?? 0), 0)
  const actual = rows.reduce((sum, c) => sum + actualAmount(c), 0)

  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="text-sm tabular-nums text-muted-foreground">
        {toCurrency(actual)} of {toCurrency(budget)}
      </span>
    </div>
  )
}

// Phone layout: the Top-categories style list (name, actual / budget, bar)
// in place of the table, keeping each row's actions menu.
function MobileSection({ title, rows, isLoading }: { title: string, rows: Category[], isLoading?: boolean }) {
  const budget = rows.reduce((sum, c) => sum + (c.budget ?? 0), 0)
  const actual = rows.reduce((sum, c) => sum + actualAmount(c), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="tabular-nums">{toCurrency(actual)} of {toCurrency(budget)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        {!isLoading && rows.length === 0 &&
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        }
        {rows.map((category, i) => (
          <CategoryProgressRow
            key={category._id?.toString() ?? `${category.name}-${i}`}
            category={category}
            link
            action={<CategoryActions category={category} />}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export default function CategoriesTable() {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const { data, isLoading, error, mutate } = useCategories({ date: currentDate })
  // One saved column choice drives both tables, so a toggle in Expenses'
  // View menu updates Income immediately.
  const [columnVisibility, setColumnVisibility] = useColumnVisibility('afba:budget-columns', DEFAULT_COLUMN_VISIBILITY)

  const { income, expenses } = useMemo(() => ({
    income: (data ?? []).filter(c => c.type === 'income'),
    expenses: (data ?? []).filter(c => c.type !== 'income'),
  }), [data])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Budget"
        actions={
          <>
            <BudgetNavigator />
            <BudgetAccountsPicker />
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState title="Couldn't load this budget" error={error} onRetry={() => mutate()} />
        </Card>
      ) : !isLoading && data?.length === 0 ? (
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
      ) : (
        <>
          <BudgetKpiCards data={data} isLoading={isLoading} />

          <div className="space-y-4 md:hidden">
            <div className="grid grid-cols-2 gap-2 [&_button]:w-full">
              <CategoryDialog category={{ date: currentDate }} />
              <CopyBudgetDialog />
            </div>
            <MobileSection title="Income" rows={income} isLoading={isLoading} />
            <MobileSection title="Expenses" rows={expenses} isLoading={isLoading} />
          </div>

          <section className="hidden space-y-3 md:block">
            <SectionHeading title="Income" rows={income} />
            <DataTable
              variant="minimal"
              data={income}
              columns={categoryColumns}
              isLoading={isLoading}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              emptyState={<EmptyState title="No income categories" description="Add one to plan this month's income." />}
            />
          </section>

          <section className="hidden space-y-3 md:block">
            <SectionHeading title="Expenses" rows={expenses} />
            <DataTable
              data={expenses}
              columns={categoryColumns}
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
          </section>
        </>
      )}
    </div>
  )
}
