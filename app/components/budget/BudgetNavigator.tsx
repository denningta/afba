'use client'

import { dateToYYYYMM, getPrevMonth, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { Button } from "@/components/ui/button"
import MonthPicker from "@/components/ui/month-picker"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"


const BudgetNavigator = () => {

  const params = useParams()
  const route = useRouter()
  const date: string = params.date ? (Array.isArray(params.date) ? params.date[0] : params.date) : dateToYYYYMM(new Date())

  useEffect(() => {
    if (!date) return



  }, [date])

  const handleNextMonth = () => {
    const nextMonth = getPrevMonth(date, -1)
    console.log(nextMonth)
    route.push(nextMonth)
  }

  const handlePreviousMonth = () => {
    const prevMonth = getPrevMonth(date, 1)
    route.push(prevMonth)
  }


  return (

    <div className="flex space-x-4 items-center">
      <Button variant="ghost"
        onClick={handlePreviousMonth}
      >
        <ChevronLeftIcon />
      </Button>

      <MonthPicker
        value={YYYYMMToDate(date)}
        onValueChange={(date) => route.push(`/budget/${dateToYYYYMM(date)}`)}
      />

      <Button variant="ghost"
        onClick={handleNextMonth}
      >
        <ChevronRightIcon />
      </Button>

    </div>


  )
}

export default BudgetNavigator
