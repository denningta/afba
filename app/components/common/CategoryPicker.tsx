"use client"

import * as React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Category } from "@/app/interfaces/categories"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPrevMonthString } from "@/app/helpers/helperFunctions"

export interface CategoryPickerProps {
  options: Category[]
  value: Category | undefined
  date: string
  autoFocus?: boolean
  // True when `value` is an auto-suggested category the user hasn't reviewed
  // yet - enables confirming it as-is with Enter (see onConfirm below).
  needsReview?: boolean
  onSelectionChange: (category: Category | undefined) => void
  onMonthChange: (date: string) => void
  // Fired when Enter is pressed on an empty search box while `needsReview`
  // is true, i.e. the user accepts the auto-suggested category without
  // searching for a different one.
  onConfirm?: () => void
}

export function CategoryPicker({
  options,
  date,
  autoFocus,
  needsReview,
  onSelectionChange,
  onMonthChange,
  onConfirm,
}: CategoryPickerProps) {
  const [search, setSearch] = React.useState('')

  const handleSelect = (value: string) => {
    const [_, id] = value.split(',')
    const category = options.find((option) => option._id?.toString() === id)
    delete category?.transactions
    category && onSelectionChange(category)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && needsReview && search.trim() === '') {
      e.preventDefault()
      e.stopPropagation()
      onConfirm?.()
    }
  }

  const handlePreviousMonth = () => {
    onMonthChange(getPrevMonthString(date, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(getPrevMonthString(date, -1))
  }

  const handleClearValue = () => {
    onSelectionChange(undefined)
  }

  // On mobile, scrolling the results list can otherwise leave the search
  // input focused after the on-screen keyboard is dismissed by the scroll
  // gesture, which some browsers then pop back up once the scroll settles.
  // Blurring proactively as soon as a scroll/drag starts prevents that.
  const handleListInteractionStart = () => {
    (document.activeElement as HTMLElement | null)?.blur?.()
  }

  return (
    <div>
      <Command>
        <CommandInput
          placeholder={needsReview ? "Confirmed - press Enter, or search to change.." : "Find a budget category.."}
          autoFocus={autoFocus}
          value={search}
          onValueChange={setSearch}
          onKeyDown={handleInputKeyDown}
        />
        <CommandList
          onTouchMove={handleListInteractionStart}
          onWheel={handleListInteractionStart}
        >
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
      <div className="w-full flex flex-wrap items-center justify-center gap-2 m-2">
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
    </div>
  )
}
