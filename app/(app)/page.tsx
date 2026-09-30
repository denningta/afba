import type { Metadata } from "next";
import Dashboard from "@/app/components/dashboard/Dashboard";

// The layout's title template skips pages in its own segment, so spell it out.
export const metadata: Metadata = { title: { absolute: "Dashboard · afba" } }

export default function Home() {
  return <Dashboard />
}
