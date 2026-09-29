import Transaction from "@/app/interfaces/transaction";
import { transactions } from "../lib/mongodb";
import { ObjectId } from "mongodb";

export async function listTransaction(filter: Transaction) {
  const res = await transactions.findOne(filter)
  return res
}

export async function replaceTransaction(filter: any, replacement: Transaction) {
  filter._id = new ObjectId(filter._id)

  const {
    _id,
    ...rest
  } = replacement

  const res = await transactions
    .replaceOne(
      filter,
      rest,
    )

  return res
}

export async function insertTransaction(transaction: Transaction) {
  const res = await transactions
    .insertOne(transaction)

  return res
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
