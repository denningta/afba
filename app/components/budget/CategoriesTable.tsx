'use client'

import { Card } from "@tremor/react";
import Table from "../Table";
import { SnackbarProvider } from "notistack"
import categoryColumns from "./CategoriesColDefs";
import { useConfirmationDialog } from "../common/Dialog";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import TableActions from "../common/TableActions";
import CopyBudgetForm from "./CopyBudgetForm";
import axios from "axios";
import { usePathname } from "next/navigation";
import getBudgetKpis from "./kpis";
import { toCurrency } from "@/app/helpers/helperFunctions";
import { CopyBudgetDialog } from "./CopyBudgetDialog";
import { createPortal } from "react-dom";
import CategoryDialog from "./CategoryDialog";
import { DataTable } from "../common/DataTable";

interface CategoriesTableProps {
}

export default function CategoriesTable({ }: CategoriesTableProps) {
  const dialog = useConfirmationDialog()

  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const {
    data,
    upsertRecord,
    mutate
  } = useCategories({ date: currentDate })


  const handleDeleteCategories = async () => {
    const res = await dialog.getConfirmation({
      title: 'Delete Category',
      content: 'Are you sure you want to delete this category?'
    })
  }

  const handleAddCategory = async (value: any) => {
    await upsertRecord(value)
  }

  const handleCopyPrevMonth = async () => {
  }

  const {
    actualSpent,
    actualIncome,
    actualDiff,
    plannedBudget,
    plannedDiff,
    plannedIncome
  } = getBudgetKpis(data)


  return (
    <div className="grid grid-cols-2 gap-4">
      <Card
      >
        <div
          className="flex space-x-5"
        >
          <div>
            <div className="uppercase">{plannedIncome.name}</div>
            <div className="font-bold text-3xl">
              {toCurrency(plannedIncome.value)}
            </div>
          </div>
          <div className="font-bold text-3xl pt-5"> - </div>
          <div>
            <div className="uppercase">{plannedBudget.name}</div>
            <div className="font-bold text-3xl">
              {toCurrency(plannedBudget.value)}
            </div>
          </div>
          <div className="font-bold text-3xl pt-5"> = </div>
          <div>
            <div className="uppercase">DIFFERENCE</div>
            <div
              style={{
                color: plannedDiff.value > 0 ? '#00d062' : 'red'
              }}
              className={`font-bold text-3xl`}
            >
              {toCurrency(plannedDiff.value)}
            </div>
          </div>
        </div>
      </Card>

      <Card
      >
        <div
          className="flex space-x-5"
        >
          <div>
            <div className="uppercase">{actualIncome.name}</div>
            <div className="font-bold text-3xl">
              {toCurrency(actualIncome.value)}
            </div>
          </div>
          <div className="font-bold text-3xl pt-5"> + </div>
          <div>
            <div className="uppercase">{actualSpent.name}</div>
            <div className="font-bold text-3xl">
              {toCurrency(actualSpent.value)}
            </div>
          </div>
          <div className="font-bold text-gray-600 text-3xl pt-5"> = </div>
          <div>
            <div className="uppercase">DIFFERENCE</div>
            <div
              style={{
                color: actualDiff.value > 0 ? '#00d062' : 'red'
              }}
              className={`font-bold text-3xl`}
            >
              {toCurrency(actualDiff.value)}
            </div>
          </div>
        </div>
      </Card>


      <Card className="col-span-2">

        <div className="flex justify-end space-x-6 mb-4">
          <CategoryDialog />
          <CopyBudgetDialog />
        </div>

        <DataTable
          data={data ?? []}
          columns={categoryColumns}
        />
        {/* <Table */}
        {/*   data={data ?? []} */}
        {/*   columns={categoryColumns} */}
        {/* /> */}
        {/**/}
        <SnackbarProvider />
      </Card>


    </div>
  )

}


