import TransactionsTable from "../components/transactions/TransactionsTable";
import { TransactionsFilter } from "../queries/transactions";

export default async function Transactions({ searchParams }: { searchParams: TransactionsFilter }) {

  return (
    <>
      <TransactionsTable searchParams={searchParams} />
    </>
  )

}
