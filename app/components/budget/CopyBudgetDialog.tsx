import useBudgetOverview from "@/app/hooks/useBudgetOverview"
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
import { Controller, useForm } from "react-hook-form"

export interface CopyBudgetDialogProps {
  value?: string
  onChange?: (value: string) => void
  onClose?: () => void
  onSubmit?: (value: string) => void
}

export function CopyBudgetDialog({
  value,
  onChange = () => { },
  onClose = () => { },
  onSubmit = () => { }
}: CopyBudgetDialogProps) {
  const { data } = useBudgetOverview()

  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ month: string }>({
    defaultValues: {
      month: value
    }
  })

  const handleCopyBudget = async (month: string) => {
    try {
      const res = await axios.post(`/api/copyCategories/${month}`, {
        currentDate: currentDate
      })
      console.log(res)

    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy />
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
                      <SelectItem value={el.date} key={`${el.date}-${index}`}>
                        <div>
                          {el.date + ' | Budget: $' + el.totalBudget}
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
