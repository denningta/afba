'use client'

import { Card, CardContent } from "@/components/ui/card";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import getBudgetKpis from "./kpis";
import { toCurrency } from "@/app/helpers/helperFunctions";
import { CopyBudgetDialog } from "./CopyBudgetDialog";
import CategoryDialog from "./CategoryDialog";
import { DataTable } from "../common/DataTable/DataTable";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BudgetNavigator from "./BudgetNavigator";
import BudgetAccountsPicker from "./BudgetAccountsPicker";
import PageHeader from "../common/PageHeader";





// The month is already in the page header; Type is implied by the row.
const DEFAULT_COLUMN_VISIBILITY = {
  date: false,
  type: false,
}

interface CategoriesTableProps {
}

export default function CategoriesTable({ }: CategoriesTableProps) {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const [isLoading, setIsLoading] = useState(true)

  const { data } = useCategories({ date: currentDate })

  useEffect(() => {
    if (data) setIsLoading(false)
  }, [data])


  const {
    actualSpent,
    actualIncome,
    actualDiff,
    plannedBudget,
    plannedDiff,
    plannedIncome
  } = getBudgetKpis(data)


  return (
    <div className="space-y-6">
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


      <div className="flex flex-col md:flex space-y-5 max-w-fit">
        <Card>
          <CardContent>
            <div className="flex space-x-5">
              <div>
                <div className="uppercase">{plannedIncome.name}</div>

                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(plannedIncome.value)}
                </div>

              </div>
              <div className="font-bold md:text-3xl pt-5"> - </div>
              <div>
                <div className="uppercase">{plannedBudget.name}</div>
                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(plannedBudget.value)}
                </div>
              </div>
              <div className="font-bold md:text-3xl pt-5"> = </div>
              <div>
                <div className="uppercase">DIFFERENCE</div>
                <div
                  style={{
                    color: plannedDiff.value >= 0 ? 'var(--positive)' : 'var(--negative)'
                  }}
                  className={`font-bold md:text-3xl h-8`}
                >
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(plannedDiff.value)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div
              className="flex space-x-5"
            >
              <div>
                <div className="uppercase">{actualIncome.name}</div>
                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualIncome.value)}
                </div>
              </div>
              <div className="font-bold md:text-3xl pt-5"> - </div>
              <div>
                <div className="uppercase">{actualSpent.name}</div>
                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualSpent.value)}
                </div>
              </div>
              <div className="font-bold md:text-3xl pt-5"> = </div>
              <div>
                <div className="uppercase">DIFFERENCE</div>
                <div
                  style={{
                    color: actualDiff.value >= 0 ? 'var(--positive)' : 'var(--negative)'
                  }}
                  className={`font-bold md:text-3xl h-8`}
                >
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualDiff.value)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">


        <div className="col-span-2 mx-2">


          <div className="flex justify-end space-x-6 mb-4">
            <CategoryDialog category={{
              date: currentDate
            }} />
            <CopyBudgetDialog />
          </div>

          <DataTable
            data={data ?? []}
            columns={categoryColumns}
            isLoading={isLoading}
            columnVisibilityStorageKey="afba:budget-columns"
            defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
          />
          <SnackbarProvider />
        </div>

      </div>

    </div>
  )

}


