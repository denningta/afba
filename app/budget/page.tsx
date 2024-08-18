import BudgetOverviewComponent from "../components/budget/BudgetOverview";
import { getBudgetOverview } from "../queries/categories";

export default async function Budget() {

  return (
    <>
      <BudgetOverviewComponent />
    </>
  )
}
