import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { TransactionsFilter } from "../queries/transactions"
import { transactionsQueryString } from "./useTransactions"

// Re-check this often, so changes made outside the app (a script or another
// tool writing through the API) show up without a reload.
const REFRESH_MS = 60_000

// A live count of transactions matching `filter`, e.g. the "needs category"
// badge. Cheap to poll: the server returns just the number.
export default function useTransactionCount(filter?: TransactionsFilter) {
  const { data, error, isLoading, mutate } = useSWR<{ count: number }, Error>(
    `/api/transactions/count${transactionsQueryString(filter)}`,
    fetcher,
    { refreshInterval: REFRESH_MS, revalidateOnFocus: true },
  )
  return { count: data?.count, error, isLoading, refresh: mutate }
}
