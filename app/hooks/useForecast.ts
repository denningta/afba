import useSWR, { useSWRConfig } from "swr"
import axios from "axios"
import { toast } from "sonner"
import { format } from "date-fns"
import fetcher from "@/app/lib/fetcher"
import { ForecastResponse, ScheduledTransaction, StreamOverride } from "@/app/interfaces/forecast"

// Always fetch the longest horizon; the page trims it client-side, so switching
// 30/60/90 days is instant.
export const FORECAST_FETCH_DAYS = 90

const isForecastKey = (key: unknown) => typeof key === 'string' && key.startsWith('/api/forecast')

const errorMessage = (err: any) => err?.response?.data?.message ?? err?.message ?? 'Please try again.'

export default function useForecast(accountId: string | null) {
  const { mutate: globalMutate } = useSWRConfig()
  // The browser's date, not the server's: the app may run in UTC.
  const from = format(new Date(), 'yyyy-MM-dd')
  const key = accountId
    ? `/api/forecast?account_id=${encodeURIComponent(accountId)}&days=${FORECAST_FETCH_DAYS}&from=${from}`
    : null
  const { data, error, isLoading, mutate } = useSWR<ForecastResponse, Error>(key, fetcher)

  const refresh = () => globalMutate(isForecastKey)

  // Each action reports its own failure and resolves true on success, so
  // callers can close dialogs only when the save worked.
  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await action()
      toast.success(success)
      await refresh()
      return true
    } catch (err) {
      toast.error(failure, { description: errorMessage(err) })
      return false
    }
  }

  const saveScheduled = (item: ScheduledTransaction) =>
    run(() => axios.post('/api/scheduled', item), item._id ? 'Scheduled item updated.' : 'Scheduled item added.', "Couldn't save the scheduled item.")

  const deleteScheduled = (id: string) =>
    run(() => axios.delete('/api/scheduled', { params: { id } }), 'Scheduled item deleted.', "Couldn't delete the scheduled item.")

  const saveOverride = (override: StreamOverride, success = 'Recurring item updated.') =>
    run(() => axios.post('/api/stream-overrides', override), success, "Couldn't update the recurring item.")

  const resetOverride = (stream_id: string) =>
    run(() => axios.delete('/api/stream-overrides', { params: { stream_id } }), "Restored Plaid's values.", "Couldn't reset the recurring item.")

  return {
    data,
    error,
    isLoading,
    mutate,
    saveScheduled,
    deleteScheduled,
    saveOverride,
    resetOverride,
  }
}
