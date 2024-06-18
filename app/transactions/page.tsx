import TransactionsTable from "../components/transactions/TransactionsTable";
import { listTransactions } from "../queries/transactions";

export default async function Transactions() {
  const data = await listTransactions()


  return (
    <div>
      <TransactionsTable data={data} />
    </div>
  )

}
