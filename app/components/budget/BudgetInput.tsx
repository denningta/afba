'use client'

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface BudgetInputProps {
  value: number | undefined
  onSave: (budget: number) => Promise<unknown>
  label: string
  className?: string
}

// This month's budget, edited in place: saves on Enter or when leaving the
// field (only if it changed); Esc puts the saved value back. Render with
// key={value} so an outside change (e.g. a one-click fill) resets the draft.
export default function BudgetInput({ value, onSave, label, className }: BudgetInputProps) {
  const saved = value ?? 0
  const [draft, setDraft] = useState(String(saved))
  const [saving, setSaving] = useState(false)

  const commit = async () => {
    const next = Number.parseFloat(draft)
    if (draft.trim() === '' || Number.isNaN(next) || next < 0) {
      setDraft(String(saved))
      return
    }
    const rounded = Math.round(next * 100) / 100
    if (rounded === saved) return
    setSaving(true)
    await onSave(rounded)
    setSaving(false)
  }

  return (
    <div className={cn("relative", className)}>
      {saving &&
        <Loader2Icon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      }
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" hidden={saving}>$</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        aria-label={label}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onFocus={e => e.target.select()}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(String(saved))
            // Let blur see the reverted value, so nothing is saved.
            requestAnimationFrame(() => (e.target as HTMLInputElement).blur())
          }
        }}
        className="h-8 [appearance:textfield] pl-6 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  )
}
