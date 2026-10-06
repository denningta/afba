import axios from "axios";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import Transaction from "../interfaces/transaction";
import { Category } from "../interfaces/categories";
import { TransactionsFilter } from "../queries/transactions";
import type { ManualTransactionInput, TransactionFieldUpdate } from "../queries/transaction";
import useData from "./useData";
import { isTransactionDerivedKey, isTransactionListKey } from "./transactionKeys";

// An empty filter gives no "?" at all, so every unfiltered caller shares the
// same SWR key (and sees each other's optimistic updates).
export function transactionsQueryString(filter?: TransactionsFilter) {
  const params = new URLSearchParams()
  Object.entries(filter ?? {}).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

const errorMessage = (err: any) => err?.response?.data?.message ?? err?.message ?? 'Unknown error'

// Every save sends only the fields it changes. Sending back whole rows (as
// the list returns them, with display dates and joined fields) used to
// rewrite the stored documents.
export default function useTransactions(filter?: TransactionsFilter) {
  const urlParams = transactionsQueryString(filter)
  const { mutate } = useSWRConfig()

  const { data, error, isLoading, mutate: refresh, listRecords } = useData<Transaction, TransactionsFilter>({
    endpoint: { listRecords: `/api/transactions${urlParams}` },
    query: filter
  })

  // Shows a change in every loaded transaction list straight away.
  const patchLists = (id: string, patch: Partial<Transaction>) =>
    mutate<Transaction[]>(
      isTransactionListKey,
      lists => Array.isArray(lists) ? lists.map(t => String(t._id) === id ? { ...t, ...patch } : t) : lists,
      { revalidate: false }
    )

  // Re-fetches lists, counts and totals; also undoes optimistic patches after
  // a failed save.
  const refreshAll = () => mutate(isTransactionDerivedKey)

  const save = async (id: string, patch: Partial<Transaction>, request: () => Promise<unknown>) => {
    await patchLists(id, patch)
    try {
      await request()
      return true
    } catch (err) {
      toast.error(`Couldn't save the transaction: ${errorMessage(err)}`)
      return false
    } finally {
      refreshAll()
    }
  }

  // Changes fields like displayName or amazonOrderUrl (null clears one).
  const updateTransaction = (transaction: Transaction, fields: TransactionFieldUpdate) => {
    const id = String(transaction._id)
    const patch = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value ?? undefined]))
    return save(id, patch, () => axios.patch('/api/transaction', { _id: id, fields }))
  }

  // Assigns a category by hand, or with `confirm` accepts the auto-assigned one.
  const setCategory = (transaction: Transaction, category: Category | undefined, { confirm = false } = {}) => {
    const id = String(transaction._id)
    const patch: Partial<Transaction> = confirm
      ? { categoryConfirmed: true }
      : { userCategory: category, categorySource: 'manual', categoryConfirmed: true }
    const next = { ...transaction, ...patch }
    return save(id, patch, () => axios.patch('/api/transactions', {
      updates: [{
        _id: id,
        userCategory: next.userCategory,
        categorySource: next.categorySource,
        categoryConfirmed: next.categoryConfirmed,
      }]
    }))
  }

  const createTransaction = async (input: ManualTransactionInput) => {
    try {
      await axios.post('/api/transaction', input)
      return true
    } catch (err) {
      toast.error(`Couldn't add the transaction: ${errorMessage(err)}`)
      return false
    } finally {
      refreshAll()
    }
  }

  return {
    data,
    error,
    isLoading,
    mutate: refresh,
    listRecords,
    createTransaction,
    updateTransaction,
    setCategory,
  }
}
