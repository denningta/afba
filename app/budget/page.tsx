import { redirect } from "next/navigation";
import { dateToYYYYMM } from "../helpers/helperFunctions";

// The old Trends page lived here; send /budget to this month's budget instead.
export const dynamic = "force-dynamic";

export default function Budget() {
  redirect(`/budget/${dateToYYYYMM(new Date())}`)
}
