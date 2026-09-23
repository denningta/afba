
import Transaction from "../interfaces/transaction";
import { TransactionsFilter } from "../queries/transactions";
import useData from "./useData";

export default function useTransactions(filter?: TransactionsFilter) {
  const urlParams = filter ? Object.keys(filter).reduce((acc, curr, i) => {
    if (!filter) return ''
    if (i > 0) acc.concat('&')
    return acc.concat(curr + '=' + filter[curr as keyof typeof filter])
  }, '?') : ''

  return useData<Transaction, TransactionsFilter>({
    endpoint: {
      listRecords: `/api/transactions${urlParams}`,
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    },
    query: filter
  })

}
