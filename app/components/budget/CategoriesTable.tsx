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

  const handleAddCategory = async () => {
    await dialog.getConfirmation({
      title: 'Add Category',
      content:
        <CategoryForm
          onSubmit={async (value) => {
            await upsertRecord(value)
            dialog.closeDialog()
          }}
          onClose={() => dialog.closeDialog()}
          initialValues={{
            date: currentDate
          }}
        />,
      showActionButtons: false
    })
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
            <div className="font-bold text-3xl text-white">
              {toCurrency(plannedIncome.value)}
            </div>
          </div>
          <div className="font-bold text-gray-600 text-3xl pt-5"> - </div>
          <div>
            <div className="uppercase">{plannedBudget.name}</div>
            <div className="font-bold text-3xl text-white">
              {toCurrency(plannedBudget.value)}
            </div>
          </div>
          <div className="font-bold text-gray-600 text-3xl pt-5"> = </div>
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
            <div className="font-bold text-3xl text-white">
              {toCurrency(actualIncome.value)}
            </div>
          </div>
          <div className="font-bold text-gray-600 text-3xl pt-5"> - </div>
          <div>
            <div className="uppercase">{actualSpent.name}</div>
            <div className="font-bold text-3xl text-white">
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

        <div className="flex justify-end">
          <CopyBudgetDialog />
        </div>

        <Table
          data={data ?? []}
          columns={categoryColumns}
        />

        <SnackbarProvider />
      </Card>
    </div>
  )

}


