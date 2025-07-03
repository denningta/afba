import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import useCategories from "@/app/hooks/useCategories"
import useTransactions from "@/app/hooks/useTransactions"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"
import { CellContext } from "@tanstack/react-table"
import { UserCategorySelector } from "../common/UserCategorySelector"
import { useState } from "react"

const UserCategoryCell = (info: CellContext<Transaction, Category | undefined>) => {
  const defaultDate = dateToYYYYMM(new Date(info.row.getValue('date')))

  const [date, setDate] = useState(defaultDate)
  const { data } = useCategories({ date: date })
  const { upsertRecord } = useTransactions()
  const [isLoading, setIsLoading] = useState(false)

  const updateTransaction = async (
    category: Category | undefined
  ) => {
    setIsLoading(true)
    const transaction: Transaction = {
      ...info.row.original,
      userCategory: category ?? undefined
    }
    await upsertRecord(transaction)
    setIsLoading(false)
  }

  const handleChangeDate = (date: string) => {
    setDate(date)
  }

  return (
    <div className="flex items-center space-x-4">
      <UserCategorySelector
        options={data ?? []}
        value={info.row.original.userCategory ?? undefined}
        date={date}
        onSelectionChange={(category) => updateTransaction(category)}
        onMonthChange={handleChangeDate}
        isLoading={isLoading}
      />
    </div>
  )

}

export default UserCategoryCell
