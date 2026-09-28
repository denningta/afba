import TransactionsTable from "../components/transactions/TransactionsTable";
import { TransactionsFilter } from "../queries/transactions";

export default async function Transactions(props: { searchParams: Promise<TransactionsFilter> }) {
  const searchParams = await props.searchParams;

  return <TransactionsTable searchParams={searchParams} />
}
