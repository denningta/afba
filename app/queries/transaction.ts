import Transaction, { isManualTransaction } from "@/app/interfaces/transaction";
import { transactions } from "../lib/mongodb";
import { ObjectId } from "mongodb";

export async function listTransaction(filter: Transaction) {
  const res = await transactions.findOne(filter)
  return res
}

export interface ManualTransactionInput {
  name: string
  // Plaid's sign convention: positive is money out, negative is money in.
  amount: number
  date: string // YYYY-MM-DD
  userCategory?: Transaction['userCategory']
}

// Fields a save may touch. Plaid's sync $sets the bank's own fields, so bank
// transactions only get fields of ours (a rename lives in displayName).
export interface TransactionFieldUpdate {
  displayName?: string | null
  amazonOrderUrl?: string | null
  // Manual transactions only.
  name?: string
  amount?: number
  date?: string
}

const BANK_EDITABLE = ['displayName', 'amazonOrderUrl'] as const
const MANUAL_EDITABLE = [...BANK_EDITABLE, 'name', 'amount', 'date'] as const

export async function createManualTransaction({ name, amount, date, userCategory }: ManualTransactionInput) {
  const doc: Transaction = {
    name,
    amount,
    date,
    pending: false,
    ...userCategory ? { userCategory, categorySource: 'manual' as const, categoryConfirmed: true } : {},
  } as Transaction
  const { insertedId } = await transactions.insertOne(doc)
  return { ...doc, _id: insertedId.toString() }
}

// Sets only the given fields; null or '' clears one. Returns null when the
// transaction doesn't exist, or the names of fields it can't take.
export async function updateTransactionFields(id: string, fields: TransactionFieldUpdate) {
  const existing = await transactions.findOne<{ transaction_id?: string }>({ _id: new ObjectId(id) }, { projection: { transaction_id: 1 } })
  if (!existing) return null

  const allowed: readonly string[] = isManualTransaction(existing) ? MANUAL_EDITABLE : BANK_EDITABLE
  const rejected = Object.keys(fields).filter(key => !allowed.includes(key))
  if (rejected.length) return { rejected }

  const $set: Record<string, unknown> = {}
  const $unset: Record<string, ''> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === '') $unset[key] = ''
    else if (value !== undefined) $set[key] = value
  }
  if (!Object.keys($set).length && !Object.keys($unset).length) return { rejected: [] }

  await transactions.updateOne(
    { _id: new ObjectId(id) },
    { ...Object.keys($set).length ? { $set } : {}, ...Object.keys($unset).length ? { $unset } : {} }
  )
  return { rejected: [] }
}

// Deletes several transactions by id. Plaid sync only updates transactions it
// already has, so deleted bank transactions don't come back on the next sync.
export async function deleteTransactions(ids: string[]) {
  return transactions.deleteMany({ _id: { $in: ids.map(id => new ObjectId(id)) } })
}

export async function deleteTransaction(query: any) {
  if (query._id) {
    query._id = new ObjectId(query._id)
  }

  const res = await transactions
    .deleteOne(query)

  return res
}


export interface TransactionCategoryUpdate {
  _id: string
  userCategory?: Transaction['userCategory']
  categorySource?: Transaction['categorySource']
  categoryConfirmed?: boolean
}

// Sets only the category fields, so a reassignment can't clobber anything
// else on the document the way a full replaceOne from stale client data could.
export async function updateTransactionCategories(updates: TransactionCategoryUpdate[]) {
  if (!updates.length) return null

  const res = await transactions.bulkWrite(updates.map(({ _id, ...fields }) => {
    const $set: Record<string, unknown> = {}
    const $unset: Record<string, ''> = {}
    for (const key of ['userCategory', 'categorySource', 'categoryConfirmed'] as const) {
      if (fields[key] === undefined) $unset[key] = ''
      else $set[key] = fields[key]
    }

    return {
      updateOne: {
        filter: { _id: new ObjectId(_id) },
        update: {
          ...Object.keys($set).length ? { $set } : {},
          ...Object.keys($unset).length ? { $unset } : {},
        }
      }
    }
  }))

  return res
}
