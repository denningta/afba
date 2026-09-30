'use client'

import { useCallback, useSyncExternalStore } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const STORAGE_KEY = 'afba:budget-compare'
const CHANGE_EVENT = 'afba:budget-compare-change'

const read = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

// Whether the budget shows last month's numbers. Remembered per browser; off
// on the server render and wherever storage is unavailable.
export function useCompareToLastMonth() {
  const compare = useSyncExternalStore(subscribe, read, () => false)
  const setCompare = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Storage blocked: nothing to remember it in.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])
  return [compare, setCompare] as const
}

export default function CompareToggle({ checked, onCheckedChange, lastMonthLabel }: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  lastMonthLabel: string
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border px-3">
      <Switch id="compare-last-month" checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor="compare-last-month" className="font-normal">Compare to {lastMonthLabel}</Label>
    </div>
  )
}
