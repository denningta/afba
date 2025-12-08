'use client'

import { Card } from "@tremor/react";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import getBudgetKpis from "./kpis";
import { toCurrency } from "@/app/helpers/helperFunctions";
import { CopyBudgetDialog } from "./CopyBudgetDialog";
import CategoryDialog from "./CategoryDialog";
import { DataTable } from "../common/DataTable";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BudgetNavigator from "./BudgetNavigator";





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
      <div className="mx-4 text-2xl">
        Budget
      </div>

      <BudgetNavigator />

      <div className="grid grid-cols-2 gap-4">

        <div className="flex flex-col md:flex">
          <Card>
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
                    color: plannedDiff.value > 0 ? '#00d062' : 'red'
                  }}
                  className={`font-bold md:text-3xl h-8`}
                >
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(plannedDiff.value)}
                </div>
              </div>
            </div>
          </Card>

          <Card >
            <div
              className="flex space-x-5"
            >
              <div>
                <div className="uppercase">{actualIncome.name}</div>
                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualIncome.value)}
                </div>
              </div>
              <div className="font-bold md:text-3xl pt-5"> + </div>
              <div>
                <div className="uppercase">{actualSpent.name}</div>
                <div className="font-bold md:text-3xl h-8">
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualSpent.value)}
                </div>
              </div>
              <div className="font-bold text-gray-600 md:text-3xl pt-5"> = </div>
              <div>
                <div className="uppercase">DIFFERENCE</div>
                <div
                  style={{
                    color: actualDiff.value > 0 ? '#00d062' : 'red'
                  }}
                  className={`font-bold md:text-3xl h-8`}
                >
                  {isLoading ? <Skeleton className="h-full w-full" /> : toCurrency(actualDiff.value)}
                </div>
              </div>
            </div>
          </Card>
        </div>

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
          />
          <SnackbarProvider />
        </div>

      </div>

    </div>
  )

}


