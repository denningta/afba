import axios from "axios"
import { TransactionsRecurringGetResponse } from "plaid"
import { useEffect, useState } from "react"
import useGetAccounts from "./useGetAccounts"

export interface UseRecurringTransactionsParams {
  access_token?: string

}
const client_user_id = 'root-user'

export default function useRecurringTransactions({ access_token }: UseRecurringTransactionsParams) {
  const { items } = useGetAccounts({ userId: client_user_id })
  const [transactions, setTransactions] = useState<TransactionsRecurringGetResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!access_token) return
    getRecurringTransactions()
  }, [access_token])

  const getRecurringTransactions = async () => {
    try {
      const res = await axios.post('/api/transactions/recurring', { access_token })

      setTransactions(res.data)

    } catch (err: any) {
      setError(err)
    }
  }



  return {
    transactions,
    loading,
    error
  }

}
