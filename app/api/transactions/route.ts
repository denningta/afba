import Transaction from '@/app/interfaces/transaction'
import { database } from '@/app/lib/mongodb'
import { listTransactions } from '@/queries/transactions'
import { v5 as uuidv5 } from 'uuid'

export async function GET(request: Request) {
  try {
    const transactions = await listTransactions()
    return Response.json(transactions)

  } catch (error: any) {
    throw new Error(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const data = assignIds(body)

    const transactions = database.collection<Transaction>('transactions')

    const res = transactions.insertMany(data)

    return Response.json(res)

  } catch (error: any) {
    throw new Error(error)
  }
}




const namespace = 'bb800b08-e351-4bb3-bff6-450e7cc44fcb'

function assignIds(data: Transaction[]) {
  return data.map((transaction) => {
    const str = transaction.originalDescription + transaction.date + transaction.amount.toString()
    transaction._id = uuidv5(str, namespace)
    return transaction
  })

}
