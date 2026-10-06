import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import useCategories from "@/app/hooks/useCategories"
import useTransactions from "@/app/hooks/useTransactions"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"
import { CellContext } from "@tanstack/react-table"
import { UserCategorySelector } from "../common/UserCategorySelector"
import { createContext, useContext, useState } from "react"

// Lets a page take over what a category change does (e.g. moving the row out
// of a list filtered to one category). Without a provider the cell saves the
// transaction itself.
export const CategoryChangeContext = createContext<
  ((transaction: Transaction, category: Category | undefined) => Promise<void>) | null
>(null)

const UserCategoryCell = (info: CellContext<Transaction, Category | undefined>) => {
  const defaultDate = dateToYYYYMM(new Date(info.row.getValue('date')))

  const [date, setDate] = useState(defaultDate)
  const { data } = useCategories({ date: date })
  const { setCategory } = useTransactions()
  const onCategoryChange = useContext(CategoryChangeContext)
  const [isLoading, setIsLoading] = useState(false)

  const updateTransaction = async (
    category: Category | undefined
  ) => {
    if (onCategoryChange) return onCategoryChange(info.row.original, category)

    setIsLoading(true)
    await setCategory(info.row.original, category)
    setIsLoading(false)
  }

  const handleConfirm = async () => {
    await setCategory(info.row.original, info.row.original.userCategory, { confirm: true })
  }

  const handleChangeDate = (date: string) => {
    setDate(date)
  }

  const needsReview = info.row.original.categorySource === 'auto' && !info.row.original.categoryConfirmed

  return (
    <div className="flex items-center space-x-4">
      <UserCategorySelector
        options={data ?? []}
        value={info.row.original.userCategory ?? undefined}
        date={date}
        needsReview={needsReview}
        onSelectionChange={(category) => updateTransaction(category)}
        onMonthChange={handleChangeDate}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  )

}

export default UserCategoryCell
