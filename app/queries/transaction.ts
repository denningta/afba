import Transaction from "@/app/interfaces/transaction";
import { transactions } from "../lib/mongodb";
import { ObjectId } from "mongodb";

export async function listTransaction(filter: Transaction) {
  const res = await transactions.findOne(filter)
  return res
}

export async function replaceTransaction(filter: Transaction, replacement: Transaction) {
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

export async function deleteTransaction(query: Transaction) {
  if (query._id) {
    query._id = query._id
  }

  const res = await transactions
    .deleteOne(query)

  return res
}

