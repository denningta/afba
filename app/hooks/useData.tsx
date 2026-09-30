import useSWR, { KeyedMutator, MutatorOptions, useSWRConfig } from "swr";
import axios from "axios";
import { ObjectId } from "mongodb";
import defaultFetcher from "@/app/lib/fetcher";
import { toast } from "sonner";

export interface DataHook<T> {
  listRecords: () => T[] | undefined
  upsertRecord: (value: T) => Promise<void | T[]>
  deleteRecord: (value: T) => Promise<void | T[]>
  data: T[] | undefined
  error: Error | undefined
  isLoading: boolean
  mutate: KeyedMutator<T[]>
}

export interface DataHookProps<R = void> {
  endpoint: {
    listRecords?: string
    upsertRecord?: string
    deleteRecord?: string
  },
  query?: R
  fetcher?: (url: string) => Promise<any>
  // false skips loading the list (e.g. data only needed behind a toggle).
  enabled?: boolean
}

export default function useData<T extends { _id?: ObjectId | string }, R = void>({
  endpoint,
  fetcher,
  enabled = true,
}: DataHookProps<R>): DataHook<T> {

  const url = enabled ? endpoint.listRecords : undefined

  const { cache, mutate } = useSWRConfig()
  // `refresh` is bound to this list, so callers' mutate() re-fetches it (the
  // global mutate from useSWRConfig does nothing without a key).
  const { data, error, isLoading, mutate: refresh } = useSWR<T[], Error>(
    url ?? null,
    fetcher ?? defaultFetcher
  )


  const listRecords = () => {
    return data
  }

  const upsertRecord = async (value: T) => {
    if (!endpoint.upsertRecord) return

    const optimisticData = (data: T[] | undefined) => {
      if (!data) return []
      return data.map((item) =>
        item._id === value._id ? { ...item, ...value } : item
      )
    }

    const handleUpsert = async () => {
      if (!endpoint.upsertRecord) return
      try {
        const res = await axios.post(endpoint.upsertRecord, value)
        if (res.status === 200) {
          return optimisticData(data)
        } else {
          return data
        }
      } catch (e: any) {
        throw new Error(e)
      }
    }

    try {
      const options: MutatorOptions = {
        optimisticData: optimisticData,
        rollbackOnError: true,
      }

      await mutate(
        url,
        handleUpsert,
        options
      )

    } catch (error: any) {
      toast('Something went wrong, please try again.')
      return data
    }

  }

  const deleteRecord = async (value: T) => {
    if (!endpoint.deleteRecord) return
    const { _id } = value

    const optimisticData = (d: T[] | undefined) => d ? d.filter((el) => el._id !== _id) : []

    const delRecord = async () => {
      if (!endpoint.deleteRecord) return
      try {
        const res = await axios.delete(endpoint.deleteRecord, { data: { _id: _id } })
        if (res.status === 200) {
          return optimisticData(data)
        } else {
          return data
        }
      } catch (e: any) {
        throw new Error(e)
      }
    }

    try {
      const options: MutatorOptions = {
        optimisticData: optimisticData,
        rollbackOnError: true
      }

      await mutate(
        url,
        delRecord,
        options
      )

      toast.success('Delete successful')

    } catch (error: any) {
      toast.error('Something went wrong, please try again.')
      return data
    }
  }

  return {
    listRecords,
    upsertRecord,
    deleteRecord,
    data,
    error,
    isLoading,
    mutate: refresh
  }
}
