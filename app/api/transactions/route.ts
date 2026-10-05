import Transaction from '@/app/interfaces/transaction'
import { database } from '@/app/lib/mongodb'
import { listTransactions } from '@/app/queries/transactions'
import { ObjectId } from 'mongodb'
import { TransactionCategoryUpdate, deleteTransactions, updateTransactionCategories } from '@/app/queries/transaction'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const transactions = await listTransactions(searchParams)

    return Response.json(transactions)

  } catch (error: any) {
    throw new Error(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const transactions = database.collection<Transaction>('transactions')
    const res = transactions.insertMany(body)
    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}

// Reassigns categories on one or more transactions (also used to undo a move).
export async function PATCH(request: Request) {
  const { updates }: { updates?: TransactionCategoryUpdate[] } = await request.json()

  if (!Array.isArray(updates) || updates.some(u => !u._id)) {
    return Response.json({ message: 'Expected { updates: [{ _id, ... }] }' }, { status: 400 })
  }

  const res = await updateTransactionCategories(updates)
  return Response.json(res)
}

// Deletes one or more transactions: { ids: [...] }.
export async function DELETE(request: Request) {
  const { ids }: { ids?: unknown } = await request.json()

  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !ObjectId.isValid(id))) {
    return Response.json({ message: 'Expected { ids: [transaction id, ...] }' }, { status: 400 })
  }

  const { deletedCount } = await deleteTransactions(ids)
  return Response.json({ deletedCount })
}
