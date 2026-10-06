'use client'

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateToYYYYMM, parseDisplayDate, toCurrency } from "@/app/helpers/helperFunctions"
import useCategories from "@/app/hooks/useCategories"
import { Category } from "@/app/interfaces/categories"
import Transaction, { isManualTransaction } from "@/app/interfaces/transaction"
import { cn } from "@/lib/utils"
import FormError from "../auth/FormError"
import { CategoryPicker } from "../common/CategoryPicker"

// What the form hands back. Amount follows Plaid's convention (positive is
// money out), so callers never deal with the Spent/Received toggle.
export interface TransactionFormValues {
  name: string
  amount: number
  date: string // YYYY-MM-DD
  category: Category | undefined
}

export interface TransactionFormProps {
  // Editing this transaction; without it the form adds a new one.
  transaction?: Transaction
  // Resolves to an error message to show, or null when saved.
  onSubmit: (values: TransactionFormValues) => Promise<string | null>
}

function CategoryField({ value, date, onChange }: { value: Category | undefined, date: string, onChange: (category: Category | undefined) => void }) {
  const [open, setOpen] = useState(false)
  // The picker pages by month; it opens on the transaction's month.
  const [month, setMonth] = useState(date)
  const { data: options } = useCategories({ date: month })

  return (
    <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setMonth(date) }}>
      <PopoverTrigger asChild>
        <Button id="transaction-category" type="button" variant="outline" className={cn("w-full justify-start", !value && "text-muted-foreground")}>
          {value ? `${value.name}${value.date && value.date !== date ? ` (${value.date})` : ''}` : 'Uncategorized'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <CategoryPicker
          options={options ?? []}
          value={value}
          date={month}
          autoFocus
          onSelectionChange={category => { onChange(category); setOpen(false) }}
          onMonthChange={setMonth}
        />
      </PopoverContent>
    </Popover>
  )
}

export default function TransactionForm({ transaction, onSubmit }: TransactionFormProps) {
  // Bank transactions keep the bank's date and amount (a sync would put them
  // back); only the name and category are ours to change.
  const fromBank = !!transaction && !isManualTransaction(transaction)

  const [name, setName] = useState(transaction ? (transaction.displayName || transaction.merchant_name || transaction.name || '') : '')
  const [date, setDate] = useState<Date>(parseDisplayDate(transaction?.date) ?? new Date())
  const [received, setReceived] = useState((transaction?.amount ?? 0) < 0)
  const [amount, setAmount] = useState(transaction?.amount ? Math.abs(transaction.amount).toFixed(2) : '')
  const [category, setCategory] = useState<Category | undefined>(transaction?.userCategory)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!fromBank && (!Number.isFinite(value) || value <= 0)) {
      setError('Enter an amount greater than zero.')
      return
    }
    setSaving(true)
    setError(null)
    const failure = await onSubmit({
      name: name.trim(),
      amount: fromBank ? transaction!.amount : (received ? -value : value),
      date: format(date, 'yyyy-MM-dd'),
      category,
    })
    setSaving(false)
    if (failure) setError(failure)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transaction-name">{fromBank ? 'Name' : 'Description'}</Label>
        <Input id="transaction-name" required value={name} onChange={e => setName(e.target.value)}
          placeholder={fromBank ? undefined : 'e.g. Farmers market'} />
        {fromBank && transaction?.displayName &&
          <button type="button" className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => setName(transaction.merchant_name || transaction.name || '')}>
            Reset to the bank&apos;s name
          </button>
        }
      </div>

      {fromBank ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <Label>Date</Label>
            <p>{format(date, 'PPP')}</p>
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <p className="tabular-nums">{transaction!.amount < 0 ? 'Received ' : 'Spent '}{toCurrency(Math.abs(transaction!.amount))}</p>
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">Date and amount come from your bank.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Date</Label>
            <DatePicker date={date} onDateChange={next => next && setDate(next)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Amount</Label>
            <div className="flex gap-2">
              <div className="inline-flex shrink-0 rounded-lg border p-0.5" role="radiogroup" aria-label="Money in or out">
                {[{ label: 'Spent', value: false }, { label: 'Received', value: true }].map(option => (
                  <Button key={option.label} type="button" size="sm" role="radio" aria-checked={received === option.value}
                    variant={received === option.value ? 'secondary' : 'ghost'} onClick={() => setReceived(option.value)}>
                    {option.label}
                  </Button>
                ))}
              </div>
              <InputGroup>
                <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
                <InputGroupInput id="transaction-amount" required inputMode="decimal" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)} />
              </InputGroup>
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="transaction-category">Category</Label>
        <CategoryField value={category} date={dateToYYYYMM(date)} onChange={setCategory} />
      </div>

      <FormError message={error} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save transaction'}</Button>
      </DialogFooter>
    </form>
  )
}
