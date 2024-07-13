import Transaction from '@/app/interfaces/transaction'
import { database } from '@/app/lib/mongodb'
import { listTransactions } from '@/app/queries/transactions'

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


