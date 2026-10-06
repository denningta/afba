import axios from "axios"
import { useState } from "react"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { isTransactionDerivedKey } from "./transactionKeys"
import { TransactionSync } from "../queries/transactionsSync"
import type { SyncStatus } from "../lib/syncTransactions"

// Just what a sync needs; satisfied by both Plaid's AccountBase and our Account.
interface SyncableAccount {
  account_id: string
  name: string
}

// Everything derived from transactions: lists, counts, budget totals,
// spending, the forecast, balances, and the "Synced 2h ago" status.
const isSyncDerivedKey = (key: unknown) =>
  isTransactionDerivedKey(key) || (typeof key === 'string' && key.startsWith('/api/balance'))

interface SyncAllResult {
  accounts: number
  added: number
  modified: number
  removed: number
  failures: SyncStatus['failures']
}

const errorMessage = (err: any) => err?.response?.data?.message ?? err?.message ?? 'Unknown error'

export default function useSyncTransactions() {

  const [transactionSyncData, setTransactionSyncData] = useState<TransactionSync | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate } = useSWRConfig()

  const postSync = async (account: SyncableAccount) => {
    const res = await axios.post<TransactionSync>('/api/transactions/sync', {
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
      mutate(isSyncDerivedKey)
      return data
    } catch (err: any) {
      setError(errorMessage(err))
      toast.error(`Sync failed for ${account.name}: ${errorMessage(err)}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Syncs every linked account on the server (one at a time, since they may
  // share a Plaid item), which also records the "last synced" status, and
  // reports a single summary instead of a toast per account.
  const syncAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post<SyncAllResult>('/api/transactions/sync', { all: true })
      if (!data.accounts) {
        toast.info('No linked accounts to sync.')
        return
      }
      const synced = data.accounts - data.failures.length
      if (synced > 0) {
        toast.success(
          `Synced ${synced} account${synced === 1 ? '' : 's'}: ${data.added} added, ${data.modified} modified, ${data.removed} removed`
        )
      }
      if (data.failures.length) {
        const failed = data.failures.map(f => `${f.accountName} (${f.message})`).join(', ')
        setError(failed)
        toast.error(`Sync failed for ${failed}`)
      }
    } catch (err: any) {
      setError(errorMessage(err))
      toast.error(`Sync failed: ${errorMessage(err)}`)
    } finally {
      setLoading(false)
      mutate(isSyncDerivedKey)
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
