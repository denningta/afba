import { Suspense } from "react";
import BudgetOverviewComponent from "../components/budget/BudgetOverview";
import PageHeader from "../components/common/PageHeader";

export default async function Budget() {

  return (
    <>
      <PageHeader title="Trends" description="Budget and spending across months." />
      <Suspense>
        <BudgetOverviewComponent />
      </Suspense>
    </>
  )
}
