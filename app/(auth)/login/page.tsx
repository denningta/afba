import { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_USERS_COLLECTION, auth } from "@/app/lib/auth"
import { database } from "@/app/lib/mongodb"
import LoginForm from "@/app/components/auth/LoginForm"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage() {
  // Already signed in: nothing to do here.
  if (await auth.api.getSession({ headers: await headers() })) redirect('/')
  // Nobody to sign in as yet.
  if (await database.collection(AUTH_USERS_COLLECTION).estimatedDocumentCount() === 0) redirect('/setup')

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
