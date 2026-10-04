import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { ObjectId } from "mongodb"
import { database } from "./mongodb"

// Household app: everyone shares one budget. Admins also manage users and bank
// connections; members just use the budget.
export const ADMIN_ROLE = 'admin'
export const MEMBER_ROLE = 'member'
export type Role = typeof ADMIN_ROLE | typeof MEMBER_ROLE

// Better Auth's own collections, prefixed so they aren't confused with our
// `users` (Plaid items) and `accounts` (bank accounts) collections.
export const AUTH_USERS_COLLECTION = 'authUsers'
export const AUTH_API_KEYS_COLLECTION = 'authApiKeys'

// Sent as `x-api-key: afba_…` by scripts and other tools instead of a cookie.
export const API_KEY_HEADER = 'x-api-key'

// Extra origins allowed to sign in, e.g. the LAN address a phone uses:
// BETTER_AUTH_TRUSTED_ORIGINS=http://192.168.1.10:3000,http://afba.lan:3000
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const adminCount = () => database.collection(AUTH_USERS_COLLECTION).countDocuments({ role: ADMIN_ROLE })

export const auth = betterAuth({
  // Standalone Mongo has no replica set, so no multi-document transactions.
  database: mongodbAdapter(database, { transaction: false }),
  user: { modelName: AUTH_USERS_COLLECTION },
  session: {
    modelName: 'authSessions',
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: { modelName: 'authAccounts' },
  verification: { modelName: 'authVerifications' },
  // No self sign-up: the first admin comes from /setup, everyone else is added
  // by an admin.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  trustedOrigins,
  // The app is served over plain http on the home network. Better Auth would
  // otherwise mark cookies Secure in production, and browsers drop those on
  // http, so nobody could stay signed in.
  advanced: { useSecureCookies: false },
  hooks: {
    // The household must always keep an admin, or nobody could manage users
    // or bank connections again.
    before: createAuthMiddleware(async ctx => {
      const demoting = ctx.path === '/admin/set-role' && ctx.body?.role !== ADMIN_ROLE
      const removing = ctx.path === '/admin/remove-user'
      if (!demoting && !removing) return

      const userId = ctx.body?.userId
      if (typeof userId !== 'string' || !ObjectId.isValid(userId)) return
      const target = await database.collection(AUTH_USERS_COLLECTION)
        .findOne({ _id: new ObjectId(userId) }, { projection: { role: 1 } })
      if (target?.role === ADMIN_ROLE && await adminCount() <= 1) {
        throw new APIError('BAD_REQUEST', { message: "You can't remove or demote the last admin." })
      }

      // A removed person's API keys go with them.
      if (removing) {
        await database.collection(AUTH_API_KEYS_COLLECTION)
          .deleteMany({ referenceId: { $in: [userId, new ObjectId(userId)] } })
      }
    }),
  },
  plugins: [
    admin({ defaultRole: MEMBER_ROLE, adminRoles: [ADMIN_ROLE] }),
    // Personal API keys. A request carrying one gets a session for the key's
    // owner, so proxy.ts and requireAdmin() treat it exactly like that person.
    apiKey({
      apiKeyHeaders: API_KEY_HEADER,
      enableSessionForAPIKeys: true,
      defaultPrefix: 'afba_',
      // Shown in the key list so people can tell keys apart (includes the prefix).
      startingCharactersConfig: { charactersLength: 11 },
      // The default is 10 requests a day, far too few for scripts.
      rateLimit: { enabled: false },
    }, { schema: { apikey: { modelName: AUTH_API_KEYS_COLLECTION } } }),
    // Lets server actions and route handlers set auth cookies.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session

// The session for a request, from its cookie or its API key, or null. Better
// Auth throws on a bad API key instead of returning null, and its API-key
// sessions skip the admin plugin's ban check, so both are handled here.
export async function getRequestSession(headers: Headers): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({ headers })
    return session?.user.banned ? null : session
  } catch {
    return null
  }
}

