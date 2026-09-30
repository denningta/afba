import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ADMIN_ROLE } from "@/app/lib/auth"
import { getSession } from "@/app/lib/session"
import ManageUsers from "@/app/components/settings/ManageUsers"

export const metadata: Metadata = { title: "Users" }

export default async function UsersPage() {
  // The admin API refuses members anyway; this just keeps them off the page.
  const session = await getSession()
  if (session?.user.role !== ADMIN_ROLE) redirect('/')
  return <ManageUsers />
}
