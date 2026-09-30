import useSWR from "swr"
import fetcher from "@/app/lib/fetcher"
import { BudgetBreakdown } from "../interfaces/budgetBreakdown"

// What a month's KPIs leave out. Only fetched while a breakdown is open.
export default function useBudgetBreakdown(month: string | undefined, enabled: boolean) {
  const { data, error, isLoading } = useSWR<BudgetBreakdown, Error>(
    enabled && month ? `/api/budget-breakdown?date=${month}` : null,
    fetcher,
  )
  return { data, error, isLoading }
}
