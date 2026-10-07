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

  // Shows changes in every loaded transaction list straight away.
  const patchLists = (patches: Map<string, Partial<Transaction>>) =>
    mutate<Transaction[]>(
      isTransactionListKey,
      lists => Array.isArray(lists)
        ? lists.map(t => patches.has(String(t._id)) ? { ...t, ...patches.get(String(t._id)) } : t)
        : lists,
      { revalidate: false }
    )

  // Re-fetches lists, counts and totals; also undoes optimistic patches after
  // a failed save.
  const refreshAll = () => mutate(isTransactionDerivedKey)

  const save = async (patches: Map<string, Partial<Transaction>>, request: () => Promise<unknown>) => {
    await patchLists(patches)
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
    return save(new Map([[id, patch]]), () => axios.patch('/api/transaction', { _id: id, fields }))
  }

  // Assigns a category by hand to one or more transactions in one save, or
  // with `confirm` accepts each one's own auto-assigned category.
  const setCategories = (transactions: Transaction[], category: Category | undefined, { confirm = false } = {}) => {
    if (!transactions.length) return Promise.resolve(true)
    const patch: Partial<Transaction> = confirm
      ? { categoryConfirmed: true }
      : { userCategory: category, categorySource: 'manual', categoryConfirmed: true }
    const patches = new Map(transactions.map(t => [String(t._id), patch]))
    return save(patches, () => axios.patch('/api/transactions', {
      updates: transactions.map(t => {
        const next = { ...t, ...patch }
        return {
          _id: String(t._id),
          userCategory: next.userCategory,
          categorySource: next.categorySource,
          categoryConfirmed: next.categoryConfirmed,
        }
      })
    }))
  }

  const setCategory = (transaction: Transaction, category: Category | undefined, options?: { confirm?: boolean }) =>
    setCategories([transaction], category, options)

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
    setCategories,
  }
}
