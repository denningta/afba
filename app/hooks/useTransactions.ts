
import Transaction from "../interfaces/transaction";
import { TransactionsFilter } from "../queries/transactions";
import useData from "./useData";

export default function useTransactions(filter?: TransactionsFilter) {
  return useData<Transaction, TransactionsFilter>({
    endpoint: {
      listRecords: '/api/transactions',
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    },
    query: filter
  })

}
