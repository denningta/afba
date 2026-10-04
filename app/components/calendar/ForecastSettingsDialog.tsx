'use client'

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, WandSparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { ForecastSettings, ForecastStream, PaySchedule } from "@/app/interfaces/forecast"
import { MerchantLogo } from "../transactions/TransactionCells"

const FREQUENCY_LABELS: Record<PaySchedule['frequency'], string> = {
  WEEKLY: 'Every week',
  BIWEEKLY: 'Every 2 weeks',
  SEMI_MONTHLY: 'Twice a month',
  MONTHLY: 'Every month',
}

const WEEKEND_LABELS: Record<PaySchedule['weekendRule'], string> = {
  before: 'Paid the Friday before',
  after: 'Paid the Monday after',
  none: 'Paid on the weekend',
}

export const payScheduleSummary = (schedule: PaySchedule) => {
  const when = schedule.frequency === 'SEMI_MONTHLY'
    ? `the ${ordinal(schedule.semiMonthlyDays?.[0] ?? 1)} and ${ordinal(schedule.semiMonthlyDays?.[1] ?? 15)}`
    : schedule.frequency === 'MONTHLY'
      ? `the ${ordinal(parseISO(schedule.anchorDate).getDate())}`
      : `from ${format(parseISO(schedule.anchorDate), 'MMM d')}`
  return `${FREQUENCY_LABELS[schedule.frequency]}, ${when}`
}

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suffix}`
}

export interface ForecastSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  settings: ForecastSettings
  paySchedules: PaySchedule[]
  // Plaid's income streams, offered as starting points for a pay schedule.
  incomeStreams: ForecastStream[]
  onSaveSettings: (settings: ForecastSettings) => Promise<boolean>
  onSavePaySchedule: (schedule: PaySchedule) => Promise<boolean>
  onDeletePaySchedule: (id: string) => Promise<boolean>
}

// The cushion kept out of "safe to spend", and the paycheck schedules that
// mark paydays (instead of Plaid's guesses).
export default function ForecastSettingsDialog(props: ForecastSettingsDialogProps) {
  const { open, onOpenChange } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Forecast settings</DialogTitle>
          <DialogDescription>
            When you get paid and how much to always keep in the account. These make &ldquo;safe to spend&rdquo; steady from day to day.
          </DialogDescription>
        </DialogHeader>
        {/* Remounted on open so edits start from the saved values. */}
        {open && <SettingsBody {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function SettingsBody({ accountId, settings, paySchedules, incomeStreams, onSaveSettings, onSavePaySchedule, onDeletePaySchedule }: ForecastSettingsDialogProps) {
  const [cushion, setCushion] = useState(String(settings.cushion))
  const [savingCushion, setSavingCushion] = useState(false)
  // The schedule being added or edited.
  const [editing, setEditing] = useState<PaySchedule | null>(null)
  const replaced = new Set(paySchedules.map(p => p.replacesStreamId).filter(Boolean))
  const suggestions = incomeStreams.filter(s => !replaced.has(s.streamId) && !s.hidden && Math.abs(s.amount) >= 100)

  const fromStream = (stream: ForecastStream): PaySchedule => ({
    account_id: accountId,
    name: stream.name,
    amount: Math.abs(stream.amount),
    frequency: stream.frequency === 'WEEKLY' || stream.frequency === 'BIWEEKLY' || stream.frequency === 'SEMI_MONTHLY' ? stream.frequency : 'MONTHLY',
    anchorDate: stream.nextDate,
    semiMonthlyDays: stream.frequency === 'SEMI_MONTHLY' ? [1, 15] : null,
    weekendRule: 'before',
    replacesStreamId: stream.streamId,
  })

  if (editing) {
    return (
      <PayScheduleForm
        schedule={editing}
        incomeStreams={incomeStreams}
        onCancel={() => setEditing(null)}
        onSave={async schedule => { if (await onSavePaySchedule(schedule)) setEditing(null) }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Label htmlFor="cushion">Cushion</Label>
        <div className="flex gap-2">
          <InputGroup>
            <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
            <InputGroupInput id="cushion" type="number" inputMode="decimal" min="0" step="1" value={cushion} onChange={e => setCushion(e.target.value)} />
          </InputGroup>
          <Button
            variant="outline"
            disabled={savingCushion || Number(cushion) < 0 || cushion === '' || Number(cushion) === settings.cushion}
            onClick={async () => {
              setSavingCushion(true)
              await onSaveSettings({ account_id: accountId, cushion: Number(cushion) })
              setSavingCushion(false)
            }}
          >
            {savingCushion && <Loader2Icon className="animate-spin" />}
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Always kept in the account and never counted as safe to spend.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">Paychecks</h3>
            <p className="text-xs text-muted-foreground">Safe to spend lasts until the next one.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing({
            account_id: accountId, name: '', amount: 0, frequency: 'BIWEEKLY',
            anchorDate: format(new Date(), 'yyyy-MM-dd'), weekendRule: 'before', semiMonthlyDays: null, replacesStreamId: null,
          })}>
            <PlusIcon /> Add
          </Button>
        </div>

        {paySchedules.length === 0 &&
          <p className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
            None yet, so Plaid&apos;s detected deposits of $500 or more mark paydays. Setting your schedule makes paydays exact.
          </p>
        }
        <ul className="divide-y rounded-lg border">
          {paySchedules.map(schedule => (
            <li key={String(schedule._id)} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{schedule.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {payScheduleSummary(schedule)} · {toCurrency(schedule.amount)}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${schedule.name}`} onClick={() => setEditing(schedule)}><PencilIcon /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${schedule.name}`} onClick={() => onDeletePaySchedule(String(schedule._id))}><Trash2Icon /></Button>
            </li>
          ))}
        </ul>

        {suggestions.length > 0 &&
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Detected by Plaid</div>
            <ul className="divide-y rounded-lg border border-dashed">
              {suggestions.map(stream => (
                <li key={stream.streamId} className="flex items-center gap-3 px-3 py-2">
                  <MerchantLogo src={stream.logoUrl} name={stream.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{stream.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {toCurrency(Math.abs(stream.amount))} · next {format(parseISO(stream.nextDate), 'MMM d')}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(fromStream(stream))}>
                    <WandSparklesIcon /> Use
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        }
      </section>
    </div>
  )
}

function PayScheduleForm({ schedule, incomeStreams, onCancel, onSave }: {
  schedule: PaySchedule
  incomeStreams: ForecastStream[]
  onCancel: () => void
  onSave: (schedule: PaySchedule) => Promise<void>
}) {
  const [name, setName] = useState(schedule.name)
  const [amount, setAmount] = useState(schedule.amount ? String(schedule.amount) : '')
  const [frequency, setFrequency] = useState<PaySchedule['frequency']>(schedule.frequency)
  const [anchor, setAnchor] = useState<Date | undefined>(parseISO(schedule.anchorDate))
  const [days, setDays] = useState<[string, string]>([
    String(schedule.semiMonthlyDays?.[0] ?? 1), String(schedule.semiMonthlyDays?.[1] ?? 15),
  ])
  const [weekendRule, setWeekendRule] = useState(schedule.weekendRule)
  const [replaces, setReplaces] = useState(schedule.replacesStreamId ?? 'none')
  const [saving, setSaving] = useState(false)

  const semi = frequency === 'SEMI_MONTHLY'
  const dayNumbers = days.map(Number)
  const validDays = !semi || (dayNumbers.every(d => Number.isInteger(d) && d >= 1 && d <= 31) && dayNumbers[0] !== dayNumbers[1])
  const valid = name.trim() !== '' && Number(amount) > 0 && !!anchor && validDays

  return (
    <form
      className="space-y-4"
      onSubmit={async e => {
        e.preventDefault()
        if (!valid || !anchor) return
        setSaving(true)
        await onSave({
          ...schedule,
          name: name.trim(),
          amount: Number(amount),
          frequency,
          anchorDate: format(anchor, 'yyyy-MM-dd'),
          semiMonthlyDays: semi ? [dayNumbers[0], dayNumbers[1]] : null,
          weekendRule,
          replacesStreamId: replaces === 'none' ? null : replaces,
        })
        setSaving(false)
      }}
    >
      <h3 className="text-sm font-medium">{schedule._id ? 'Edit paycheck' : 'Add paycheck'}</h3>
      <div className="space-y-2">
        <Label htmlFor="pay-name">Name</Label>
        <Input id="pay-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tim's paycheck" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pay-amount">Take-home amount</Label>
          <InputGroup>
            <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
            <InputGroupInput id="pay-amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </InputGroup>
        </div>
        <div className="space-y-2">
          <Label>How often</Label>
          <Select value={frequency} onValueChange={v => setFrequency(v as PaySchedule['frequency'])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {semi ? (
        <div className="space-y-2">
          <Label>Days of the month</Label>
          <div className="flex items-center gap-2">
            <Input aria-label="First payday of the month" type="number" min="1" max="31" className="w-20" value={days[0]} onChange={e => setDays([e.target.value, days[1]])} />
            <span className="text-sm text-muted-foreground">and</span>
            <Input aria-label="Second payday of the month" type="number" min="1" max="31" className="w-20" value={days[1]} onChange={e => setDays([days[0], e.target.value])} />
          </div>
          <p className="text-xs text-muted-foreground">Use 31 for the last day of the month.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{frequency === 'MONTHLY' ? 'A payday (sets the day of the month)' : 'Next payday'}</Label>
          <div><DatePicker date={anchor} onDateChange={setAnchor} /></div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>On a weekend</Label>
          <Select value={weekendRule} onValueChange={v => setWeekendRule(v as PaySchedule['weekendRule'])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(WEEKEND_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Replaces Plaid&apos;s</Label>
          <Select value={replaces} onValueChange={setReplaces}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nothing</SelectItem>
              {incomeStreams.map(s => <SelectItem key={s.streamId} value={s.streamId}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The deposit Plaid detected for this paycheck is replaced by your schedule, so it isn&apos;t counted twice.
      </p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Back</Button>
        <Button type="submit" disabled={saving || !valid}>
          {saving && <Loader2Icon className="animate-spin" />}
          Save paycheck
        </Button>
      </DialogFooter>
    </form>
  )
}
