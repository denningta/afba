import { transactionsSync } from "../lib/mongodb"

export interface TransactionSync {
  account_id: string
  next_cursor: string
  has_more: boolean
  request_id: string
  transactions_update_status: string
  added: number
  modified: number
  removed: number
  syncTimestamp: Date
}

export async function insertTransactionSync(sync: TransactionSync) {
  const res = await transactionsSync.insertOne(sync)

  return res
}

export async function getLastTransactionSync(account_id: string) {
  const query: any[] = [
    {
      $match:
      {
        account_id: account_id
      }
    },
    {
      $sort:
      {
        syncTimestamp: -1
      }
    },
    {
      $limit:
        1
    }
  ]


  const res = await transactionsSync
    .aggregate<TransactionSync>(query).toArray()

  return res
}
