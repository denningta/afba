import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { CategorySpendingResponse } from "../interfaces/categorySpending"

// Per-category actuals for the `months` months ending with `end` (YYYY-MM).
export default function useCategorySpending(end: string, months: number) {
  const { data, error, isLoading, mutate } = useSWR<CategorySpendingResponse, Error>(
    `/api/category-spending?end=${end}&months=${months}`,
    fetcher,
  )
  return { data, error, isLoading, mutate }
}
