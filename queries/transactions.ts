import Transaction from "@/app/interfaces/transaction";
import { database } from "@/app/lib/mongodb";

export async function listTransactions() {

  const transactions = await database
    .collection<Transaction>('transactions')
    .find()
    .toArray()

  return transactions
}
