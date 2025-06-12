import { dateToYYYYMM, getPlaceholderData, getPrevMonth, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import useBudgetOverview from "@/app/hooks/useBudgetOverview"
import { Button } from "@/components/ui/button"
import MonthPicker from "@/components/ui/month-picker"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"


const BudgetNavigator = () => {

  const params = useParams()
  const route = useRouter()
  const date: string = Array.isArray(params.date) ? params.date[0] : params.date

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
        onValueChange={(date) => route.push(dateToYYYYMM(date))}
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
