import { Suspense } from "react";
import ForecastCalendar from "../components/calendar/ForecastCalendar";

export default async function CalendarPage() {

  return (
    <Suspense>
      <ForecastCalendar />
    </Suspense>
  )

}
