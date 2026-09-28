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

export default function CategoriesTable() {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const { data, isLoading } = useCategories({ date: currentDate })

  const { income, expenses } = useMemo(() => ({
    income: (data ?? []).filter(c => c.type === 'income'),
    expenses: (data ?? []).filter(c => c.type !== 'income'),
  }), [data])

  return (
    <div className="space-y-8">
      <PageHeader
        className="mb-0"
        title="Budget"
        actions={
          <>
            <BudgetNavigator />
            <BudgetAccountsPicker />
          </>
        }
      />

      <BudgetKpiCards data={data} isLoading={isLoading} />

      <section className="space-y-3">
        <SectionHeading title="Income" rows={income} />
        <DataTable
          variant="minimal"
          data={income}
          columns={categoryColumns}
          isLoading={isLoading}
          columnVisibilityStorageKey="afba:budget-columns"
          defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        />
      </section>

      <section className="space-y-3">
        <SectionHeading title="Expenses" rows={expenses} />
        <DataTable
          data={expenses}
          columns={categoryColumns}
          isLoading={isLoading}
          columnVisibilityStorageKey="afba:budget-columns"
          defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
          toolbarActions={
            <>
              <CategoryDialog category={{ date: currentDate }} />
              <CopyBudgetDialog />
            </>
          }
        />
      </section>
    </div>
  )
}
