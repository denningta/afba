import { z } from "zod"
import { ADMIN_ROLE, AUTH_USERS_COLLECTION, auth } from "@/app/lib/auth"
import { database } from "@/app/lib/mongodb"

// Whether the app still needs its first admin. Open to signed-out visitors, so
// it says nothing else.
export async function GET() {
  return Response.json({ needsSetup: await needsSetup() })
}

const SetupBody = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
})

// Creates the first account, as admin. Only works while there are no users,
// so nobody can claim admin once the household is set up.
export async function POST(req: Request) {
  if (!await needsSetup()) {
    return Response.json({ message: 'Setup is already done. Sign in instead.' }, { status: 409 })
  }

  const parsed = SetupBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ message: 'Enter a name, a valid email and a password of at least 8 characters.' }, { status: 400 })
  }

  const { name, email, password } = parsed.data
  // Called without request headers, the admin plugin allows this as a
  // server-side operation (sign-up itself is disabled).
  await auth.api.createUser({ body: { name, email, password, role: ADMIN_ROLE } })
  return Response.json({ ok: true })
}

async function needsSetup() {
  return await database.collection(AUTH_USERS_COLLECTION).estimatedDocumentCount() === 0
}
