import type { Metadata } from "next";
import CategorySpending from "@/app/components/spending/CategorySpending";
import PageHeader from "@/app/components/common/PageHeader";

export const metadata: Metadata = { title: "Spending" }

export default function SpendingPage() {
  return (
    <>
      <PageHeader title="Spending" description="Monthly actuals per budget category." />
      <CategorySpending />
    </>
  )
}
