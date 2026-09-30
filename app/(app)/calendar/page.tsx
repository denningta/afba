import type { Metadata } from "next";
import { Suspense } from "react";
import ForecastCalendar from "@/app/components/calendar/ForecastCalendar";

export const metadata: Metadata = { title: "Forecast" }

export default async function CalendarPage() {

  return (
    <Suspense>
      <ForecastCalendar />
    </Suspense>
  )

}
