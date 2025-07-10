import useBudgetOverview from "@/app/hooks/useBudgetOverview"
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
import { Copy } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
  const [isLoading, setIsLoading] = useState(false)

  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const {
    control,
    handleSubmit,
  } = useForm<{ month: string }>({
    defaultValues: {
      month: value
    }
  })

  const handleCopyBudget = async (month: string) => {
    setIsLoading(true)
    try {
      const res = await axios.post(`/api/copyCategories/${month}`, {
        currentDate: currentDate
      })

      setIsLoading(false)
    } catch (e: any) {
      console.error(e)
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">

        <form
          onSubmit={handleSubmit((value) => handleCopyBudget(value.month))}
          className="space-y-6"
        >
          <DialogHeader>
            <DialogTitle>Copy Budget</DialogTitle>
            <DialogDescription>
              Copy a budget from a previous month
            </DialogDescription>
          </DialogHeader>

          <Controller
            name="month"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                name={field.name}
                onValueChange={(value) => {
                  field.onChange(value ?? null);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a month.." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {data && data.map((el, index) =>
                      <SelectItem value={el.date} key={index}>
                        <div>
                          {el.date + ' | Budget: $' + el.budget}
                        </div>
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <DialogFooter>
            <Button type="submit">Copy budget</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
