import type { Metadata } from "next";
import AssignQueue from "@/app/components/transactions/assign/AssignQueue"

export const metadata: Metadata = { title: "Assign categories" }

export default function AssignCategories() {
  return <AssignQueue />
}
