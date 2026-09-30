'use client'

import axios from "axios"
import { useEffect } from "react"
import { SWRConfig } from "swr"
import { toast } from "sonner"
import { FetchError } from "../lib/fetcher"

// A 401 means the session ended (expired, signed out elsewhere, or revoked by
// an admin): go sign in again and come back, rather than showing an error.
function redirectToLogin() {
  const { pathname, search } = window.location
  if (pathname === '/login' || pathname === '/setup') return
  window.location.assign(`/login?next=${encodeURIComponent(pathname + search)}`)
}

// One app-wide notice when data fails to load, so an outage (e.g. the
// database being down) never just looks like an empty page. The fixed toast
// id collapses simultaneous failures into a single message.
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  // Mutations go through axios; send those to sign-in on a 401 too.
  useEffect(() => {
    const id = axios.interceptors.response.use(undefined, error => {
      if (error?.response?.status === 401) redirectToLogin()
      return Promise.reject(error)
    })
    return () => axios.interceptors.response.eject(id)
  }, [])

  return (
    <SWRConfig
      value={{
        onError: (error: Error) => {
          if (error instanceof FetchError && error.status === 401) {
            redirectToLogin()
            return
          }
          toast.error("Couldn't load data from the server", {
            id: 'swr-load-error',
            description: error?.message,
          })
        },
        // Retrying won't sign anyone in.
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (error instanceof FetchError && (error.status === 401 || error.status === 403)) return
          if (retryCount >= 5) return
          setTimeout(() => revalidate({ retryCount }), 5000 * 2 ** retryCount)
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
