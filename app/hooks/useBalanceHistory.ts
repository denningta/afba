import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { BalanceHistoryResponse } from "@/app/interfaces/balance"

export default function useBalanceHistory(startDate: string, endDate: string) {
  const { data, error, isLoading } = useSWR<BalanceHistoryResponse, Error>(
    `/api/balance?startDate=${startDate}&endDate=${endDate}`,
    fetcher
  )

  return { data, error, isLoading }
}
