import { ObjectId } from "mongodb"
import { ISO_DATE } from "@/app/interfaces/transaction"
import { createManualTransaction, deleteTransaction, TransactionFieldUpdate, updateTransactionFields } from "@/app/queries/transaction"

const badRequest = (message: string) => Response.json({ message }, { status: 400 })

// Adds a transaction by hand (cash, a missing bank item, ...).
export async function POST(request: Request) {
  const { name, amount, date, userCategory } = await request.json()

  if (typeof name !== 'string' || !name.trim()) return badRequest('name is required')
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) return badRequest('amount must be a non-zero number')
  if (typeof date !== 'string' || !ISO_DATE.test(date)) return badRequest('date must be YYYY-MM-DD')

  const transaction = await createManualTransaction({ name: name.trim(), amount, date, userCategory: userCategory ?? undefined })
  return Response.json(transaction)
}

// Changes some of a transaction's fields: { _id, fields: { displayName, ... } }.
// Bank transactions only take our own fields (see updateTransactionFields).
export async function PATCH(request: Request) {
  const { _id, fields }: { _id?: string, fields?: TransactionFieldUpdate } = await request.json()

  if (typeof _id !== 'string' || !ObjectId.isValid(_id)) return badRequest('_id is required')
  if (!fields || typeof fields !== 'object') return badRequest('fields is required')
  if (fields.amount !== undefined && (typeof fields.amount !== 'number' || !Number.isFinite(fields.amount) || fields.amount === 0)) {
    return badRequest('amount must be a non-zero number')
  }
  if (fields.date !== undefined && (typeof fields.date !== 'string' || !ISO_DATE.test(fields.date))) {
    return badRequest('date must be YYYY-MM-DD')
  }
  if (fields.name !== undefined && (typeof fields.name !== 'string' || !fields.name.trim())) return badRequest("name can't be empty")

  const res = await updateTransactionFields(_id, fields)
  if (!res) return Response.json({ message: 'Transaction not found' }, { status: 404 })
  if (res.rejected.length) {
    return badRequest(`Bank transactions can't change ${res.rejected.join(', ')}; only their name and category`)
  }
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const body = await request.json()

  if (typeof body._id !== 'string' || !ObjectId.isValid(body._id)) return badRequest('_id is required')

  const res = await deleteTransaction({ _id: body._id })
  return Response.json(res)
}
