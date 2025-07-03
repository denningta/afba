import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Category } from "@/app/interfaces/categories"
import { ChevronLeft, ChevronRight, Loader, LoaderCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getPrevMonthString } from "@/app/helpers/helperFunctions"

export interface UserCategorySelectorProps {
  options: Category[]
  value: Category | undefined
  date: string
  isLoading?: boolean
  onSelectionChange?: (categroy: Category | undefined) => void
  onMonthChange?: (date: string) => void
}

export function UserCategorySelector({
  options,
  value,
  date,
  isLoading,
  onSelectionChange = () => { },
  onMonthChange = () => { }

}: UserCategorySelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const [_, id] = value.split(',')
    const category = options.find((option) => option._id?.toString() === id)
    delete category?.transactions
    category && onSelectionChange(category)
    setOpen(false)
  }

  const handlePreviousMonth = () => {
    const prevMonth = getPrevMonthString(date, 1)
    onMonthChange(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = getPrevMonthString(date, -1)
    onMonthChange(nextMonth)
  }

  const handleClearValue = () => {
    onSelectionChange(undefined)
    setOpen(false)

  }

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-[150px] justify-start">
            {value ? <Badge>{value.name}</Badge> : <div className="text-accent">+</div>}
            {!value && isLoading && <div className="transition ease-in-out animate-spin w-full flex justify-center"><LoaderCircle /></div>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="right" align="start">
          <Command>
            <CommandInput placeholder="Find a budget category.." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option._id?.toString()}
                    value={option.name + ',' + option._id}
                    onSelect={handleSelect}
                  >
                    <div className="w-full flex">
                      <div className="grow">{option.name}</div>
                      <div>{option.date}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <Separator />
          <div className="w-full flex items-center justify-center m-2 space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft />
            </Button>
            <div className="text-sm">{date}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextMonth}
            >
              <ChevronRight />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearValue}
            >
              clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
