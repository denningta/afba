
import { useEffect, useState } from "react"
import { format, addYears, subYears } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { dateToYYYYMM } from "@/app/helpers/helperFunctions"

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export interface MonthPickerProps {
  value: Date
  onValueChange: (date: Date) => void
}

export default function MonthPicker({
  value,
  onValueChange = () => { }
}: MonthPickerProps) {
  const [date, setDate] = useState<Date>(value ?? new Date())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setDate(value)
  }, [])

  useEffect(() => {
    onValueChange(date)
  }, [date])

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(date.getFullYear(), monthIndex)
    setDate(newDate)
    setIsOpen(false)
  }

  const handleYearChange = (increment: number) => {
    setDate(prevDate => increment > 0 ? addYears(prevDate, 1) : subYears(prevDate, 1))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM yyyy") : <span>Pick a month</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">{date.getFullYear()}</div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant="outline"
                className={cn(
                  "h-10",
                  date.getMonth() === index && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
