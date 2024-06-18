import Transaction from '@/app/interfaces/transaction'
import { database } from '@/app/lib/mongodb'
import { listTransactions } from '@/app/queries/transactions'
import { v5 as uuidv5 } from 'uuid'

export async function GET(request: Request) {
  try {
    const transactions = await listTransactions(1, 50)

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




const namespace = 'bb800b08-e351-4bb3-bff6-450e7cc44fcb'

function assignIds(data: Transaction[]) {
  return data.map((transaction) => {
    const {
      originalDescription,
      date,
      amount
    } = transaction
    if (!originalDescription || !date || !amount) return transaction
    const str = originalDescription + date + amount?.toString()
    transaction._id = uuidv5(str, namespace)
    return transaction
  })

}
