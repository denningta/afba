import axios from "axios"
import { useState } from "react"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { TransactionSync } from "../queries/transactionsSync"

// Just what a sync needs; satisfied by both Plaid's AccountBase and our Account.
interface SyncableAccount {
  account_id: string
  name: string
}

// Everything derived from transactions: the lists, budget totals and balances.
const isTransactionDerivedKey = (key: unknown) =>
  typeof key === 'string' && ['/api/transactions', '/api/categories', '/api/budget', '/api/balance']
    .some(prefix => key.startsWith(prefix))

const errorMessage = (err: any) => err?.response?.data?.message ?? err?.message ?? 'Unknown error'

export default function useSyncTransactions() {

  const [transactionSyncData, setTransactionSyncData] = useState<TransactionSync | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate } = useSWRConfig()

  const postSync = async (account: SyncableAccount) => {
    const res = await axios.post<TransactionSync>('/api/transactions/sync', {
      userId: 'root-user',
      account_id: account.account_id
    })
    return res.data
  }

  // Resolves to the sync result, or null on failure (already reported with a
  // toast) - it never rejects, so callers can fire and forget.
  const syncTransactions = async (account: SyncableAccount): Promise<TransactionSync | null> => {
    setLoading(true)
    setError(null)
    try {
      const data = await postSync(account)
      setTransactionSyncData(data)
      toast.success(
        `Transactions synced for ${account.name}: ${data.added} records added, ${data.modified} records modified, and ${data.removed} records removed`
      )
      mutate(isTransactionDerivedKey)
      return data
    } catch (err: any) {
      setError(errorMessage(err))
      toast.error(`Sync failed for ${account.name}: ${errorMessage(err)}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Syncs accounts one at a time (they may share a Plaid item) and reports a
  // single summary instead of a toast per account.
  const syncAll = async (accounts: SyncableAccount[]) => {
    if (!accounts.length) {
      toast.info('No linked accounts to sync.')
      return
    }
    setLoading(true)
    setError(null)
    const totals = { added: 0, modified: 0, removed: 0 }
    const failed: string[] = []
    try {
      for (const account of accounts) {
        try {
          const data = await postSync(account)
          totals.added += data.added
          totals.modified += data.modified
          totals.removed += data.removed
        } catch (err: any) {
          failed.push(`${account.name} (${errorMessage(err)})`)
        }
      }
    } finally {
      setLoading(false)
      mutate(isTransactionDerivedKey)
    }

    const synced = accounts.length - failed.length
    if (synced > 0) {
      toast.success(
        `Synced ${synced} account${synced === 1 ? '' : 's'}: ${totals.added} added, ${totals.modified} modified, ${totals.removed} removed`
      )
    }
    if (failed.length) {
      setError(failed.join(', '))
      toast.error(`Sync failed for ${failed.join(', ')}`)
    }
  }

  return {
    syncTransactions,
    syncAll,
    transactionSyncData,
    loading,
    error
  }
}
