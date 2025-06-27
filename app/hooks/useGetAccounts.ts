import axios from "axios"
import { useEffect, useState } from "react"
import { GetAccountsParams } from "../api/accounts/route"
import { AccountsGetResponse } from "plaid"


export default function useGetAccounts({ userId }: GetAccountsParams) {
  const [items, setItems] = useState<AccountsGetResponse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) setItems(null)
    getAccounts()
  }, [])

  const getAccounts = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await axios.post('/api/accounts', { userId })
      setItems(res.data)

    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { items, loading, error }

}

