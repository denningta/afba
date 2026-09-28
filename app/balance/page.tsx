import { Suspense } from "react";
import BalanceOverview from "../components/balance/BalanceOverview";
import PageHeader from "../components/common/PageHeader";

export default async function BalancePage() {
  return (
    <>
      <PageHeader title="Balances" description="Account balances over time." />
      <Suspense>
        <BalanceOverview />
      </Suspense>
    </>
  )
}
