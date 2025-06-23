import { transactions, transactionsSync } from "@/app/lib/mongodb"
import plaidClient from "@/app/lib/plaid"
import { getLastTransactionSync, insertTransactionSync, TransactionSync } from "@/app/queries/transactionsSync"
import { listUser } from "@/app/queries/users"
import { RemovedTransaction, Transaction, TransactionsSyncRequest, TransactionsSyncResponse } from "plaid"

export interface TransactionsSyncParams {
  userId?: string
  account_id?: string
  count?: number
}

export async function POST(request: Request) {
  try {
    const {
      userId,
      account_id,
      count
    } = await request.json() as TransactionsSyncParams

    const user = await listUser({ userId })
    if (!user) return Response.json({ message: 'User does not exist', status: 400 })
    if (!account_id) return Response.json({ message: 'account_id is missing and is a required parameter', status: 500 })

    const transactionSync = await getLastTransactionSync(account_id)
    let cursor: string | null = transactionSync[0]?.next_cursor ?? null

    let added: Array<Transaction> = []
    let modified: Array<Transaction> = []
    let removed: Array<RemovedTransaction> = []
    let hasMore = true
    let syncResponse = {}

    while (hasMore) {
      const req: TransactionsSyncRequest = {
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: user.items[0].plaidAccessToken,
        cursor: cursor,
        options: { account_id }
      }

      if (count) req.count = count

      const response = await plaidClient.transactionsSync(req)
      const data = response.data

      added = added.concat(data.added)
      modified = modified.concat(data.modified)
      removed = removed.concat(data.removed)

      hasMore = data.has_more

      cursor = data.next_cursor

      syncResponse = {
        account_id: account_id,
        next_cursor: data.next_cursor,
        has_more: data.has_more,
        request_id: data.request_id,
        transactions_update_status: data.transactions_update_status,
        added: data.added.length,
        modified: data.modified.length,
        removed: data.removed.length,
        syncTimestamp: new Date()
      } as TransactionSync
    }

    if (added.length) {
      await transactions.insertMany(added)
    }

    if (modified.length) {
      const bulkOps = modified.map(transaction => ({
        updateOne: {
          filter: { transaction_id: transaction.transaction_id },
          update: { $set: transaction }
        }
      }))

      await transactions.bulkWrite(bulkOps)
    }

    if (removed.length) {
      const transactionIds = removed.map(tx => tx.transaction_id)
      await transactions.deleteMany({ transaction_id: { $in: transactionIds } })
    }

    syncResponse = {
      ...syncResponse as TransactionSync,
      added: added.length,
      modified: modified.length,
      removed: removed.length,
      syncTimestamp: new Date()
    }

    const syncRes = await insertTransactionSync(syncResponse as TransactionSync)

    console.log(syncRes)
    console.log(syncResponse)

    return Response.json(syncResponse)

  } catch (error: any) {
    throw new Error(error)
  }
}


