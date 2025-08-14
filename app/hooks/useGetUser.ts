import axios from "axios"
import { useEffect, useState } from "react"
import { GetAccountsParams } from "../api/accounts/route"

export interface GetUserParams {
  userId: string
}

export interface User {
  _id: string
  userId: string
  items: {
    item_id: string
    plaidAccessToken: string
  }[]
}


export default function useGetUser({ userId }: GetUserParams) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) setUser(null)
    getUser()
  }, [])

  const getUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await axios.get('/api/user', { params: { userId: userId } })
      setUser(res.data)

    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error }

}

