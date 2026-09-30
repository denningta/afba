import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

// Same origin as the app, so no baseURL: works on localhost and the LAN IP.
export const authClient = createAuthClient({
  plugins: [adminClient()],
})

export const { useSession, signIn, signOut } = authClient
