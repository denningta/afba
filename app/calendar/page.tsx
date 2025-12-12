
import { Suspense } from "react";
import ForecastCalendar from "../components/calendar/ForecastCalendar";
import CreatePlaidLink from "../components/Plaid/PlaidLink";

export default async function CalendarPage() {

  return (
    <Suspense>
      <ForecastCalendar />
    </Suspense>

  )

}
