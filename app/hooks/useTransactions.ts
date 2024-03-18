
import Transaction from "../interfaces/transaction";
import useData from "./useData";

export default function useTransactions() {
  return useData<Transaction>({
    endpoint: {
      listRecords: '/api/transactions',
      upsertRecord: '/api/transaction',
      deleteRecord: '/api/transaction'
    }
  })

}
