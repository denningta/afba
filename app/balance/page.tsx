import { Suspense } from "react";
import BalanceOverview from "../components/balance/BalanceOverview";

export default async function BalancePage() {
  return (
    <Suspense>
      <BalanceOverview />
    </Suspense>
  )
}
