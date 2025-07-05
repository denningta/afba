import { BudgetOverview } from "../components/budget/BudgetOverview";
import { BudgetSummary } from "../components/budget/CopyBudgetDialog";
import useData from "./useData";

export default function useBudgetSummary() {
  return useData<BudgetSummary>({
    endpoint: {
      listRecords: '/api/budget-summary',
    }
  })

}
