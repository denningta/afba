
import Transaction from "../interfaces/transaction";
import { TransactionsFilter } from "../queries/transactions";
import useData from "./useData";

// An empty filter gives no "?" at all, so every unfiltered caller shares the
// same SWR key (and sees each other's optimistic updates).
export function transactionsQueryString(filter?: TransactionsFilter) {
  const params = new URLSearchParams()
  Object.entries(filter ?? {}).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export default function useTransactions(filter?: TransactionsFilter) {
  const urlParams = transactionsQueryString(filter)

  return useData<Transaction, TransactionsFilter>({
    endpoint: {
      listRecords: `/api/transactions${urlParams}`,
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    },
    query: filter
  })

}
