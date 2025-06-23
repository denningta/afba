import axios from "axios"
import { GetItemParams } from "../api/items/route"
import { useEffect, useState } from "react"


export default function useGetItems({ userId }: GetItemParams) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getItems()
  }, [])

  const getItems = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await axios.post('/api/items', { userId })
      setItems(res.data)

    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { items, loading, error }

}

