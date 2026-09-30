import { Metadata } from "next"
import { redirect } from "next/navigation"
import { AUTH_USERS_COLLECTION } from "@/app/lib/auth"
import { database } from "@/app/lib/mongodb"
import SetupForm from "@/app/components/auth/SetupForm"

export const metadata: Metadata = { title: "Set up" }

// Checks the database on every request, never at build time.
export const dynamic = "force-dynamic"

export default async function SetupPage() {
  // Only for the very first account.
  if (await database.collection(AUTH_USERS_COLLECTION).estimatedDocumentCount() > 0) redirect('/login')
  return <SetupForm />
}
