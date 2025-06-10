import { BudgetOverview } from "../components/budget/BudgetOverview";
import useData from "./useData";

export default function useBudgetVsActual(date: string) {
  return useData<BudgetOverview>({
    endpoint: {
      listRecords: `/api/budget-vs-actual?date=${date}`,
    }
  })

}
