'use client'

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parseISO } from "date-fns"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { ScheduledTransaction } from "@/app/interfaces/forecast"

const FREQUENCY_LABELS: Record<ScheduledTransaction['frequency'], string> = {
  once: 'Once',
  WEEKLY: 'Every week',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Every month',
  ANNUALLY: 'Every year',
}

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  kind: z.enum(["expense", "income"]),
  amount: z.string().refine(val => Number(val) > 0, { message: "Enter an amount above zero." }),
  date: z.date({ required_error: "Pick a date." }),
  frequency: z.enum(["once", "WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUALLY"]),
  endDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

export interface ScheduledItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  // Present when editing an existing item.
  item?: ScheduledTransaction
  onSave: (item: ScheduledTransaction) => Promise<boolean>
}

// Add or edit a user-entered upcoming transaction for the forecast.
export default function ScheduledItemDialog({ open, onOpenChange, accountId, item, onSave }: ScheduledItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit scheduled item' : 'Add scheduled item'}</DialogTitle>
          <DialogDescription>
            A transaction you know is coming that isn&apos;t already a recurring bill or paycheck.
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so reopening for a different item starts from its values. */}
        <ScheduledItemForm
          key={item?._id ? String(item._id) : 'new'}
          accountId={accountId}
          item={item}
          onCancel={() => onOpenChange(false)}
          onSave={async (value) => {
            const saved = await onSave(value)
            if (saved) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ScheduledItemForm({ accountId, item, onCancel, onSave }: {
  accountId: string
  item?: ScheduledTransaction
  onCancel: () => void
  onSave: (item: ScheduledTransaction) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name ?? '',
      // Plaid sign: negative amounts are money in.
      kind: item && item.amount < 0 ? 'income' : 'expense',
      amount: item ? String(Math.abs(item.amount)) : '',
      date: item ? parseISO(item.date) : undefined,
      frequency: item?.frequency ?? 'once',
      endDate: item?.endDate ? parseISO(item.endDate) : undefined,
    },
  })

  const frequency = useWatch({ control: form.control, name: 'frequency' })

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const amount = Math.abs(Number(values.amount))
      await onSave({
        _id: item?._id,
        account_id: accountId,
        name: values.name,
        amount: values.kind === 'income' ? -amount : amount,
        date: format(values.date, 'yyyy-MM-dd'),
        frequency: values.frequency,
        endDate: values.frequency !== 'once' && values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <Tabs value={field.value} onValueChange={field.onChange}>
                <TabsList className="w-full" aria-label="Money in or out">
                  <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
                  <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Property tax" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
                  <InputGroupInput type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" {...field} />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{frequency === 'once' ? 'Date' : 'First date'}</FormLabel>
                <FormControl>
                  <div><DatePicker date={field.value} onDateChange={field.onChange} /></div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeats</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(FREQUENCY_LABELS) as ScheduledTransaction['frequency'][]).map(key => (
                      <SelectItem key={key} value={key}>{FREQUENCY_LABELS[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {frequency !== 'once' &&
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ends <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                <FormControl>
                  <div><DatePicker date={field.value} onDateChange={field.onChange} /></div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        }

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2Icon className="animate-spin" />}
            {item ? 'Save changes' : 'Add item'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
