'use client'

import { Card } from "@tremor/react";
import BalanceChart from "../components/balance/BalanceChart";
import AccountSelect from "../components/calendar/AccountSelect";
import { useState } from "react";

export default function BalancePage() {
  const [accountId, setAccountId] = useState<string | undefined>(undefined)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Account Balance</h1>
      <Card>
        <div className="h-96">
          <BalanceChart accountId={accountId} />
        </div>
      </Card>
      <div className="w-1/4">
        <AccountSelect
          onValueChange={setAccountId}
        />
      </div>
    </div>
  )
}
