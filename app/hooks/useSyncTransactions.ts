import axios from "axios"
import { AccountBase } from "plaid"
import { useState } from "react"
import { toast } from "sonner"
import { TransactionSync } from "../queries/transactionsSync"

export default function useSyncTransactions() {

  const [transactionSyncData, setTransactionSyncData] = useState<TransactionSync | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  const syncTransactions = async (account: AccountBase) => {
    let responseData: TransactionSync | null = null
    try {
      setLoading(true)
      const res = await axios.post('/api/transactions/sync', {
        userId: 'root-user',
        account_id: account.account_id
      })
      responseData = res.data
      setTransactionSyncData(res.data)

    } catch (err: any) {
      setError(err)


    } finally {
      setLoading(false)
      if (!responseData) throw new Error('Did not recieve a response for transactionSyncData')
      const { added, modified, removed } = responseData

      toast.success(
        `Transactions synced for ${account.name}: ${added} records added, ${modified} records modified, and ${removed} records removed`
      )
    }
  }

  return {
    syncTransactions,
    transactionSyncData,
    loading,
    error
  }





}
