import useBudgetSummary from "@/app/hooks/useBudgetSummary"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axios from "axios"
import { Copy, Loader2Icon, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { format } from "date-fns"
import useCategories from "@/app/hooks/useCategories"
import { toCurrency, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

export interface CopyBudgetDialogProps {
  value?: string
  onChange?: (value: string) => void
  onClose?: () => void
  onSubmit?: (value: string) => void
}

export interface BudgetSummary {
  _id?: any
  date: string
  budget: number
}

export function CopyBudgetDialog({
  value,
}: CopyBudgetDialogProps) {
  const { data } = useBudgetSummary()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useSWRConfig()

  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()
  const { data: currentCategories } = useCategories({ date: currentDate })

  // Other months that have a plan, newest first.
  const months = (data ?? [])
    .filter(el => el.date !== currentDate)
    .sort((a, b) => b.date.localeCompare(a.date))

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<{ month: string }>({
    defaultValues: {
      month: value
    }
  })

  const handleCopyBudget = async (month: string) => {
    setIsLoading(true)
    try {
      const res = await axios.post(`/api/copyCategories/${month}`, { currentDate })
      toast.success(`Copied ${res.data.inserted} categor${res.data.inserted === 1 ? 'y' : 'ies'} from ${monthLabel(month)}.`)
      // Refresh this month's budget, the summary list and the trends chart.
      mutate(key => typeof key === 'string' && (key.startsWith('/api/categories') || key.startsWith('/api/budget')))
      setOpen(false)
      reset()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Copy failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const existing = currentCategories?.length ?? 0
  const selectedMonth = useWatch({ control, name: 'month' })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy />
          Copy budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={handleSubmit((value) => handleCopyBudget(value.month))}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle>Copy budget</DialogTitle>
            <DialogDescription>
              Copy every category and its budgeted amount from another month into {currentDate ? monthLabel(currentDate) : 'this month'}.
            </DialogDescription>
          </DialogHeader>

          <Controller
            name="month"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                name={field.name}
                onValueChange={(value) => field.onChange(value ?? null)}
              >
                <SelectTrigger className="w-full" aria-label="Month to copy from">
                  <SelectValue placeholder="Choose a month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {months.map(el =>
                      <SelectItem value={el.date} key={el.date}>
                        <span>{monthLabel(el.date)}</span>
                        <span className="ml-auto pl-4 tabular-nums text-muted-foreground">{toCurrency(el.budget)}</span>
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />

          {existing > 0 &&
            <p className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              This month already has {existing} categor{existing === 1 ? 'y' : 'ies'}. Copying adds to them, so matching names will be duplicated.
            </p>
          }

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedMonth}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Copy budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function monthLabel(yyyymm: string) {
  try {
    return format(YYYYMMToDate(yyyymm), 'MMMM yyyy')
  } catch {
    return yyyymm
  }
}
