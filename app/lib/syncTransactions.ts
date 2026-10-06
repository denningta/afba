import { RemovedTransaction, TransactionsSyncRequest } from "plaid"
import { accounts, database, transactions } from "@/app/lib/mongodb"
import plaidClient from "@/app/lib/plaid"
import { HOUSEHOLD_ID } from "@/app/lib/household"
import { buildMerchantCategoryMap, suggestCategory } from "@/app/lib/autoCategorize"
import { getLastTransactionSync, insertTransactionSync, TransactionSync } from "@/app/queries/transactionsSync"
import { listUser } from "@/app/queries/users"
import Transaction from "@/app/interfaces/transaction"

// A sync failure with a message fit to show (Plaid's own when it has one) and
// the HTTP status the API route should answer with.
export class SyncError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message)
  }
}

const errorMessage = (error: any) =>
  error instanceof SyncError ? error.message
    : error?.response?.data?.error_message ?? error?.message ?? 'Transaction sync failed'

// One sync per account at a time. Two syncs from the same cursor (say the
// scheduler and a click on Sync) would both insert the same new transactions.
const running = new Map<string, Promise<TransactionSync>>()

export function syncAccount(account_id: string): Promise<TransactionSync> {
  const previous = running.get(account_id) ?? Promise.resolve()
  const next = previous.catch(() => undefined).then(() => runSync(account_id))
  running.set(account_id, next)
  next.finally(() => { if (running.get(account_id) === next) running.delete(account_id) }).catch(() => undefined)
  return next
}

async function runSync(account_id: string): Promise<TransactionSync> {
  const user = await listUser({ userId: HOUSEHOLD_ID })
  if (!user) throw new SyncError('No bank connections yet', 400)

  // Each account belongs to one item; its token is the only one Plaid will accept.
  const account = await accounts.findOne({ account_id })
  const item = user.items.find((i: { item_id: string }) => i.item_id === account?.item_id)
  if (!item) throw new SyncError(`No linked item found for account ${account_id}`, 404)

  const transactionSync = await getLastTransactionSync(account_id)
  let cursor: string | null = transactionSync[0]?.next_cursor ?? null

  let added: Array<Transaction> = []
  let modified: Array<Transaction> = []
  let removed: Array<RemovedTransaction> = []
  let hasMore = true
  let last: Omit<TransactionSync, 'added' | 'modified' | 'removed' | 'syncTimestamp'> | null = null

  try {
    while (hasMore) {
      const req: TransactionsSyncRequest = {
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: item.plaidAccessToken,
        cursor: cursor,
        options: { account_id }
      }

      const { data } = await plaidClient.transactionsSync(req)

      added = added.concat(data.added)
      modified = modified.concat(data.modified)
      removed = removed.concat(data.removed)

      hasMore = data.has_more
      cursor = data.next_cursor
      last = {
        account_id,
        next_cursor: data.next_cursor,
        has_more: data.has_more,
        request_id: data.request_id,
        transactions_update_status: data.transactions_update_status,
      }
    }
  } catch (error) {
    throw new SyncError(errorMessage(error))
  }

  if (added.length) {
    const merchantCategoryMap = await buildMerchantCategoryMap()

    for (const transaction of added) {
      const suggestion = await suggestCategory(transaction, merchantCategoryMap)
      if (suggestion) {
        transaction.userCategory = suggestion.category
        transaction.categorySource = 'auto'
        transaction.categoryConfirmed = false
        transaction.categoryConfidence = suggestion.confidence
      }
    }

    await transactions.insertMany(added)
  }

  if (modified.length) {
    await transactions.bulkWrite(modified.map(transaction => ({
      updateOne: {
        filter: { transaction_id: transaction.transaction_id },
        update: { $set: transaction }
      }
    })))
  }

  if (removed.length) {
    await transactions.deleteMany({ transaction_id: { $in: removed.map(tx => tx.transaction_id) } })
  }

  const result: TransactionSync = {
    ...last!,
    added: added.length,
    modified: modified.length,
    removed: removed.length,
    syncTimestamp: new Date()
  }
  await insertTransactionSync(result)
  return result
}

// The outcome of the latest sync of all accounts, for "Synced 2h ago" and
// for spotting a bank login that needs renewing.
export interface SyncStatus {
  lastRunAt: Date
  // When every account last synced without an error.
  lastSuccessAt: Date | null
  failures: { account_id: string, accountName: string, message: string }[]
}

const syncStatus = database.collection<SyncStatus & { _id: string }>('syncStatus')
const STATUS_ID = 'transactions'

export async function getSyncStatus(): Promise<SyncStatus | null> {
  const doc = await syncStatus.findOne({ _id: STATUS_ID })
  if (!doc) return null
  const { _id, ...status } = doc
  return status
}

// Syncs every bank-linked account one at a time (several may share a Plaid
// item) and records the outcome. Never throws; failures go in the status.
export async function syncAllAccounts() {
  const linked = await accounts.find({ item_id: { $exists: true, $nin: [null, ''] } }).toArray()
  const totals = { added: 0, modified: 0, removed: 0 }
  const failures: SyncStatus['failures'] = []

  for (const account of linked) {
    try {
      const res = await syncAccount(account.account_id)
      totals.added += res.added
      totals.modified += res.modified
      totals.removed += res.removed
    } catch (error) {
      failures.push({ account_id: account.account_id, accountName: account.name ?? account.account_id, message: errorMessage(error) })
    }
  }

  await recordSyncRun(failures)
  return { accounts: linked.length, ...totals, failures }
}

export async function recordSyncRun(failures: SyncStatus['failures']) {
  const now = new Date()
  await syncStatus.updateOne(
    { _id: STATUS_ID },
    { $set: { lastRunAt: now, failures, ...failures.length ? {} : { lastSuccessAt: now } } },
    { upsert: true }
  )
}
