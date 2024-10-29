import { dateToYYYYMM } from "@/app/helpers/helperFunctions"
import useCategories from "@/app/hooks/useCategories"
import useTransactions from "@/app/hooks/useTransactions"
import { Category } from "@/app/interfaces/categories"
import Transaction from "@/app/interfaces/transaction"
import { SyntheticEvent } from "react"
import AutoComplete from "../common/AutoComplete"
import { CellContext } from "@tanstack/react-table"

const UserCategoryCell = (info: CellContext<Transaction, Category | undefined>) => {
  const date = dateToYYYYMM(new Date(info.row.getValue('date')))
  const { data } = useCategories({ date: date })
  const { upsertRecord } = useTransactions()

  const updateTransaction = async (
    event: SyntheticEvent<Element, Event>,
    category: Category | null
  ) => {
    const transaction: Transaction = {
      ...info.row.original,
      userCategory: category ?? undefined
    }
    await upsertRecord(transaction)
  }

  return (
    <div>
      <AutoComplete
        options={data ?? []}
        value={info.row.original.userCategory ?? null}
        isOptionEqualToValue={(option, value) => (option?._id === value?._id)}
        getOptionLabel={(option) => option.name ?? ''}
        onChange={(event, value) => updateTransaction(event, value)}
        autoHighlight={true}
      />
    </div>
  )

}

export default UserCategoryCell
