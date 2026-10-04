import { NextRequest, NextResponse } from "next/server"
import { AUTH_USERS_COLLECTION, getRequestSession } from "@/app/lib/auth"
import { database } from "@/app/lib/mongodb"

// Reachable without signing in. Everything else, pages and API alike, needs a
// valid session (checked against the database, not just "a cookie exists") or
// a valid API key.
const PUBLIC_PATHS = ['/login', '/setup', '/api/auth', '/api/setup']

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const session = await getRequestSession(request.headers)
  if (session) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Sign in to continue.' }, { status: 401 })
  }

  // Until the first admin exists, send everyone to create it.
  const noUsers = await database.collection(AUTH_USERS_COLLECTION).estimatedDocumentCount() === 0
  const url = new URL(noUsers ? '/setup' : '/login', request.url)
  if (!noUsers && pathname !== '/') url.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(url)
}

export const config = {
  // Skip Next's own assets and static files in public/.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
