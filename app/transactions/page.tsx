import TransactionsTable from "../components/transactions/TransactionsTable";
import { listTransactions } from "../queries/transactions";

export default async function Transactions() {

  return (
    <div>
      <TransactionsTable />
    </div>
  )

}
