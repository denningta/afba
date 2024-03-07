
import Transaction from "../interfaces/transaction";
import useData from "./useData";

export default function useTransactions() {
  return useData<Transaction>({
    endpoint: {
      listRecords: '/api/categories',
      upsertRecord: '/api/category',
      deleteRecord: '/api.category'
    }
  })

}
