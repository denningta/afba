import axios from "axios";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import Transaction, { transactionLabel } from "../interfaces/transaction";
import { isTransactionDerivedKey } from "./transactionKeys";

export const describeTransactions = (transactions: Transaction[]) =>
  transactions.length === 1
    ? transactionLabel(transactions[0]) || '1 transaction'
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
      await mutate(isTransactionDerivedKey)
    }
  }
}
