
import Transaction from "../interfaces/transaction";
import { TransactionsFilter } from "../queries/transactions";
import { useSWRConfig } from "swr";
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
  const { mutate } = useSWRConfig()

  const data = useData<Transaction, TransactionsFilter>({
    endpoint: {
      listRecords: `/api/transactions${urlParams}`,
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    },
    query: filter
  })

  // useData only refreshes this list; counts (like the "needs category"
  // badge) live under their own keys, so refresh them after any change.
  const refreshCounts = () => mutate(key => typeof key === 'string' && key.startsWith('/api/transactions/count'))

  return {
    ...data,
    upsertRecord: async (value: Transaction) => {
      const res = await data.upsertRecord(value)
      refreshCounts()
      return res
    },
    deleteRecord: async (value: Transaction) => {
      const res = await data.deleteRecord(value)
      refreshCounts()
      return res
    },
  }
}
