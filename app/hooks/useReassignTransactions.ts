import axios from "axios";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import Transaction from "../interfaces/transaction";
import { Category } from "../interfaces/categories";
import type { TransactionCategoryUpdate } from "../queries/transaction";

// Everything whose numbers depend on which category a transaction is in.
const isAffectedKey = (key: unknown) =>
  typeof key === 'string' && ['/api/transactions', '/api/categories', '/api/budget'].some(prefix => key.startsWith(prefix))

const describe = (transactions: Transaction[]) =>
  transactions.length === 1
    ? transactions[0].merchant_name || transactions[0].name || '1 transaction'
    : `${transactions.length} transactions`

const snapshot = ({ _id, userCategory, categorySource, categoryConfirmed }: Transaction): TransactionCategoryUpdate => ({
  _id: String(_id),
  userCategory,
  categorySource,
  categoryConfirmed,
})

/**
 * Moves transactions to another category from a list filtered to one
 * category (`listKey`): the rows leave the list straight away, and a toast
 * confirms the move with an Undo that puts every row back as it was.
 */
export default function useReassignTransactions(listKey: string) {
  const { mutate } = useSWRConfig()

  const revalidate = () => mutate(isAffectedKey)

  const patch = (updates: TransactionCategoryUpdate[]) =>
    axios.patch('/api/transactions', { updates })

  const undo = async (previous: TransactionCategoryUpdate[], label: string) => {
    try {
      await patch(previous)
      toast.success(`Restored ${label}`)
    } catch {
      toast.error(`Couldn't undo moving ${label}.`)
    } finally {
      await revalidate()
    }
  }

  const reassign = async (transactions: Transaction[], category: Category | undefined) => {
    if (!transactions.length) return

    const movedIds = new Set(transactions.map(t => String(t._id)))
    const previous = transactions.map(snapshot)
    const label = describe(transactions)
    const destination = category?.name ?? 'Uncategorized'
    const removeMoved = (data: Transaction[] | undefined) =>
      (data ?? []).filter(t => !movedIds.has(String(t._id)))

    try {
      await mutate<Transaction[]>(
        listKey,
        async (data) => {
          await patch(transactions.map(t => ({
            _id: String(t._id),
            userCategory: category,
            categorySource: 'manual',
            categoryConfirmed: true,
          })))
          return removeMoved(data)
        },
        {
          optimisticData: removeMoved,
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch {
      toast.error(`Couldn't move ${label}. Please try again.`)
      return
    }

    toast.success(`Moved ${label} to ${destination}`, {
      action: { label: 'Undo', onClick: () => undo(previous, label) },
    })
    await revalidate()
  }

  return { reassign }
}
