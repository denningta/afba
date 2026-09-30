import { useSession } from "../lib/auth-client"

// The signed-in person. `isAdmin` only drives what the UI offers; the server
// enforces it separately.
export default function useCurrentUser() {
  const { data, isPending, error } = useSession()
  const user = data?.user
  return {
    user,
    isAdmin: user?.role === 'admin',
    isPending,
    error,
  }
}
