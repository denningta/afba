"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { format, startOfYear, eachMonthOfInterval, isBefore, isAfter, isSameMonth } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MonthRangePickerProps {
  value?: { from: Date, to: Date }
  onRangeChange?: (range: { from: Date; to: Date } | undefined) => void
}

export default function MonthRangePicker({ value, onRangeChange }: MonthRangePickerProps) {
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>()
  const [year, setYear] = useState(new Date().getFullYear())
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: new Date(year, 11, 31)
  })

  const handleMonthClick = useCallback((clickedMonth: Date) => {
    setDate(currentDate => {
      if (selecting === 'start') {
        setSelecting('end')
        return { from: clickedMonth, to: clickedMonth }
      } else {
        setSelecting('start')
        if (currentDate && isBefore(clickedMonth, currentDate.from)) {
          return { from: clickedMonth, to: currentDate.from }
        }
        return currentDate ? { ...currentDate, to: clickedMonth } : { from: clickedMonth, to: clickedMonth }
      }
    })
  }, [selecting])

  const handleYearChange = useCallback((increment: number) => {
    setYear(prevYear => prevYear + increment)
  }, [])

  const isInRange = useCallback((month: Date) => {
    if (!date) return false
    return (isAfter(month, date.from) && isBefore(month, date.to))
  }, [date])

  const isRangeEnd = useCallback((month: Date) => {
    if (!date) return false
    return isSameMonth(month, date.from) || isSameMonth(month, date.to)
  }, [date])

  React.useEffect(() => {
    if (onRangeChange) {
      onRangeChange(date)
    }
  }, [date, onRangeChange])

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to && !isSameMonth(date.from, date.to) ? (
                <>
                  {format(date.from, "MMM yyyy")} - {format(date.to, "MMM yyyy")}
                </>
              ) : (
                format(date.from, "MMM yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleYearChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{year}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleYearChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => (
                <Button
                  key={month.toISOString()}
                  variant="outline"
                  className={cn(
                    "h-9",
                    isInRange(month) && "bg-primary/20 text-primary-foreground",
                    isRangeEnd(month) && "bg-primary text-primary-foreground ring-2 ring-primary",
                  )}
                  onClick={() => handleMonthClick(month)}
                >
                  {format(month, "MMM")}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {selecting === 'start' ? 'Select start month' : 'Select end month'}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
