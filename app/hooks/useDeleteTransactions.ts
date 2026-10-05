import axios from "axios";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import Transaction from "../interfaces/transaction";

// Everything whose numbers include transactions: lists, counts, budgets,
// spending, and the forecast.
const isAffectedKey = (key: unknown) =>
  typeof key === 'string'
  && ['/api/transactions', '/api/categories', '/api/budget', '/api/category-spending', '/api/forecast']
    .some(prefix => key.startsWith(prefix))

export const describeTransactions = (transactions: Transaction[]) =>
  transactions.length === 1
    ? transactions[0].merchant_name || transactions[0].name || '1 transaction'
    : `${transactions.length} transactions`

/**
 * Deletes transactions for good, then refreshes everything that counts them.
 * Resolves to whether the delete went through (a toast reports either way).
 */
export default function useDeleteTransactions() {
  const { mutate } = useSWRConfig()

  return async (transactions: Transaction[]): Promise<boolean> => {
    if (!transactions.length) return true
    const label = describeTransactions(transactions)

    try {
      await axios.delete('/api/transactions', { data: { ids: transactions.map(t => String(t._id)) } })
      toast.success(`Deleted ${label}.`)
      return true
    } catch {
      toast.error(`Couldn't delete ${label}. Please try again.`)
      return false
    } finally {
      await mutate(isAffectedKey)
    }
  }
}
