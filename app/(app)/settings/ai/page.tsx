import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ADMIN_ROLE } from "@/app/lib/auth"
import { getSession } from "@/app/lib/session"
import AiSettings from "@/app/components/settings/AiSettings"

export const metadata: Metadata = { title: "AI assistant" }

export default async function AiSettingsPage() {
  // The settings API refuses members anyway; this just keeps them off the page.
  const session = await getSession()
  if (session?.user.role !== ADMIN_ROLE) redirect('/')
  return <AiSettings />
}
