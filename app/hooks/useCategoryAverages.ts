import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { CategoryAveragesResponse } from "../interfaces/categoryAverages"

export const AVERAGE_MONTHS = 6

// Per-category averages over the months before `month`. Only fetched while
// the budget's compare view is on.
export default function useCategoryAverages(month: string | undefined, enabled: boolean) {
  const { data, error, isLoading } = useSWR<CategoryAveragesResponse, Error>(
    enabled && month ? `/api/category-averages?date=${month}&months=${AVERAGE_MONTHS}` : null,
    fetcher,
  )
  return { data, error, isLoading }
}
