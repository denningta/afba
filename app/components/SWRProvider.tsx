'use client'

import { SWRConfig } from "swr"
import { toast } from "sonner"

// One app-wide notice when data fails to load, so an outage (e.g. the
// database being down) never just looks like an empty page. The fixed toast
// id collapses simultaneous failures into a single message.
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        onError: (error: Error) => {
          toast.error("Couldn't load data from the server", {
            id: 'swr-load-error',
            description: error?.message,
          })
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
