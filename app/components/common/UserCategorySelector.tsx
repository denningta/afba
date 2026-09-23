import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Category } from "@/app/interfaces/categories"
import { LoaderCircle, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CategoryPicker } from "./CategoryPicker"

export interface UserCategorySelectorProps {
  options: Category[]
  value: Category | undefined
  date: string
  isLoading?: boolean
  // True when the category was auto-assigned and hasn't been reviewed yet.
  needsReview?: boolean
  onSelectionChange?: (categroy: Category | undefined) => void
  onMonthChange?: (date: string) => void
  // Fired the first time the user opens the picker on a needs-review category,
  // marking it reviewed even if they don't end up changing the category.
  onConfirm?: () => void
}

export function UserCategorySelector({
  options,
  value,
  date,
  isLoading,
  needsReview,
  onSelectionChange = () => { },
  onMonthChange = () => { },
  onConfirm = () => { }

}: UserCategorySelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && needsReview) onConfirm()
  }

  const handleSelectionChange = (category: Category | undefined) => {
    onSelectionChange(category)
    setOpen(false)
  }

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-[150px] justify-start">
            {value ? (
              needsReview ? (
                <Badge variant="secondary" className="gap-1">
                  <TriangleAlert className="h-3 w-3" />
                  {value.name}
                </Badge>
              ) : (
                <Badge>{value.name}</Badge>
              )
            ) : <div className="text-accent">+</div>}
            {!value && isLoading && <div className="transition ease-in-out animate-spin w-full flex justify-center"><LoaderCircle /></div>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="right" align="start">
          <CategoryPicker
            options={options}
            value={value}
            date={date}
            autoFocus
            onSelectionChange={handleSelectionChange}
            onMonthChange={onMonthChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
