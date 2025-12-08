'use client'

import { useData } from "@/app/hooks/useData";
import { Balance } from "@/app/interfaces/balance";
import { AreaChart } from "@tremor/react";

interface BalanceChartProps {
  accountId?: string;
}

export default function BalanceChart({ accountId }: BalanceChartProps) {
  const { data, isLoading } = useData<Balance>(accountId ? `/api/balance?accountId=${accountId}` : null)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>Select an account to view the balance</div>
  }

  return (
    <AreaChart
      className="h-full"
      data={data}
      index="date"
      categories={['balance']}
      colors={['blue']}
      yAxisWidth={60}
    />
  )
}
