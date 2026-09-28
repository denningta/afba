import { Suspense } from "react";
import ForecastCalendar from "../components/calendar/ForecastCalendar";
import PageHeader from "../components/common/PageHeader";

export default async function CalendarPage() {

  return (
    <>
      <PageHeader title="Forecast" description="Projected balance from recurring transactions." />
      <Suspense>
        <ForecastCalendar />
      </Suspense>
    </>
  )

}
