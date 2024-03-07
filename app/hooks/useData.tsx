import useSWR, { KeyedMutator } from "swr";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import { ObjectId } from "mongodb";
import fetcher from "@/app/lib/fetcher";

export interface DataHook<T> {
  listRecords: () => T[] | undefined
  upsertRecord: (value: T) => Promise<void | T>
  deleteRecord: (value: T) => Promise<boolean | T>
  data: T[] | undefined
  error: Error | undefined
  isLoading: boolean
  mutate: KeyedMutator<T[]>
}

export interface DataHookProps {
  endpoint: {
    listRecords: string
    upsertRecord: string
    deleteRecord: string
  }
}

export default function useData<T extends { _id?: ObjectId }>({
  endpoint
}: DataHookProps): DataHook<T> {
  const { data, error, isLoading, mutate } = useSWR<T[], Error>(
    endpoint.listRecords,
    fetcher
  )

  const listRecords = () => {
    return data
  }

  const upsertRecord = async (value: T) => {
    try {
      const res = await axios.post(endpoint.upsertRecord, value)
      if (data) {
        const index = data?.findIndex((el) => el._id === value._id)
        data[index] = value
        mutate(data, { rollbackOnError: true })
      }
      return res.data
    } catch (error: any) {
      enqueueSnackbar('Something went wrong, please try again.', { variant: 'error' })
    }
  }

  const deleteRecord = async (value: T) => {
    const { _id } = value

    try {
      const res = await axios.delete(endpoint.deleteRecord, { data: { _id: _id } })
      if (data) mutate(
        data.filter(d => d._id !== _id),
        { rollbackOnError: true }
      )
      return true
    } catch (error: any) {
      enqueueSnackbar('Something went wrong, please try again.', { variant: 'error' })
      return false
    }
  }

  return {
    listRecords,
    upsertRecord,
    deleteRecord,
    data,
    error,
    isLoading,
    mutate
  }
}
