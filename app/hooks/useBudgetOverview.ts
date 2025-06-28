import { BudgetOverview } from "../components/budget/BudgetOverview";
import useData from "./useData";

export default function useBudgetOverview() {
  console.log('BudgetOverview runs!')
  return useData<BudgetOverview>({
    endpoint: {
      listRecords: '/api/budgetOverview',
    }
  })

}
