import { headers } from "next/headers"
import { ADMIN_ROLE, auth } from "./auth"

// For route handlers. proxy.ts already turns away signed-out requests; these
// re-check (and add the admin check) where it matters most.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export const unauthorized = () => Response.json({ message: 'Sign in to continue.' }, { status: 401 })
export const forbidden = () => Response.json({ message: 'Only an admin can do that.' }, { status: 403 })

// Returns an error Response to send back, or null when the caller is an admin:
//   const denied = await requireAdmin(); if (denied) return denied
export async function requireAdmin(): Promise<Response | null> {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.user.role !== ADMIN_ROLE) return forbidden()
  return null
}
