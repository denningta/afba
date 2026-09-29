'use client'

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { DatePicker } from "@/components/ui/date-picker"
import { ForecastStream, StreamOverride } from "@/app/interfaces/forecast"

export interface StreamOverrideDialogProps {
  stream: ForecastStream | null
  onOpenChange: (open: boolean) => void
  onSave: (override: StreamOverride) => Promise<boolean>
}

// Correct Plaid's guess for a recurring bill or paycheck: its amount and the
// date of the next occurrence. Later occurrences follow from that date.
export default function StreamOverrideDialog({ stream, onOpenChange, onSave }: StreamOverrideDialogProps) {
  return (
    <Dialog open={!!stream} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {stream?.name}</DialogTitle>
          <DialogDescription>
            Adjust what the forecast expects. Plaid&apos;s own detection is left untouched, and you can reset to it any time.
          </DialogDescription>
        </DialogHeader>
        {stream &&
          <OverrideForm
            key={stream.streamId}
            stream={stream}
            onCancel={() => onOpenChange(false)}
            onSave={async (override) => {
              if (await onSave(override)) onOpenChange(false)
            }}
          />
        }
      </DialogContent>
    </Dialog>
  )
}

function OverrideForm({ stream, onCancel, onSave }: {
  stream: ForecastStream
  onCancel: () => void
  onSave: (override: StreamOverride) => Promise<void>
}) {
  const income = stream.amount < 0
  const [amount, setAmount] = useState(String(Math.abs(stream.amount)))
  const [nextDate, setNextDate] = useState<Date | undefined>(parseISO(stream.nextDate))
  const [saving, setSaving] = useState(false)
  const valid = Number(amount) > 0 && !!nextDate

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid || !nextDate) return
        setSaving(true)
        try {
          const value = Math.abs(Number(amount))
          await onSave({
            stream_id: stream.streamId,
            amount: income ? -value : value,
            nextDate: format(nextDate, 'yyyy-MM-dd'),
          })
        } finally {
          setSaving(false)
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="override-amount">{income ? 'Amount received' : 'Amount paid'}</Label>
        <InputGroup>
          <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
          <InputGroupInput
            id="override-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </InputGroup>
      </div>
      <div className="space-y-2">
        <Label>Next date</Label>
        <div><DatePicker date={nextDate} onDateChange={setNextDate} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving || !valid}>
          {saving && <Loader2Icon className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
