import { BudgetOverview } from "../components/budget/BudgetOverview";
import useData from "./useData";

export default function useBudgetOverview() {
  return useData<BudgetOverview>({
    endpoint: {
      listRecords: '/api/budgetOverview',
    }
  })

}
