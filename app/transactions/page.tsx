import TransactionsTable from "../components/transactions/TransactionsTable";
import { TransactionsFilter } from "../queries/transactions";

export default async function Transactions({ searchParams }: { searchParams: TransactionsFilter }) {

  return (
    <div className="-my-5 py-5">
      <TransactionsTable searchParams={searchParams} />
    </div>
  )

}
