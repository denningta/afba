import { transactions } from "@/app/lib/mongodb";

export async function listTransactions() {
  const res = await transactions
    .find()
    .toArray()

  return res
}
