import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

// Same origin as the app, so no baseURL: works on localhost and the LAN IP.
export const authClient = createAuthClient({
  plugins: [adminClient(), apiKeyClient()],
})

export const { useSession, signIn, signOut } = authClient
