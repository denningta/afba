import BudgetOverview from "../components/budget/BudgetOverview";
import { getBudgetOverview } from "../queries/categories";

export default async function Budget() {

  const data = await getBudgetOverview()

  return (
    <>
      <BudgetOverview data={data} />
    </>
  )
}
