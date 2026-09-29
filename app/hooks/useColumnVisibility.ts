import { useEffect, useState } from "react"
import { VisibilityState } from "@tanstack/react-table"

// Column visibility saved to localStorage under `storageKey`. Defaults apply
// until the user changes a column; saved choices win for the columns they
// cover. Pass a null key for plain, unsaved state.
export default function useColumnVisibility(storageKey: string | null, defaults: VisibilityState = {}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaults)
  const [loaded, setLoaded] = useState(false)

  // Read after mount (not in the useState initializer) to avoid a hydration mismatch.
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
        setColumnVisibility({ ...defaults, ...saved })
      } catch {
        // Storage unavailable or corrupt - fall back to the defaults already in state.
      }
    }
    setLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (!loaded || !storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility))
    } catch {
      // Storage unavailable - column choices just won't persist.
    }
  }, [columnVisibility])

  return [columnVisibility, setColumnVisibility] as const
}
