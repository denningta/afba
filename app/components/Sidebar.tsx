import { RiHomeFill, RiMoneyDollarCircleFill, RiPieChartFill, RiUploadCloudFill, RiUploadFill } from "@remixicon/react"
import NavItem from "./NavItem"
import { ThemeToggle } from "./common/ThemeToggle"
import { CalendarIcon, CalendarX, PlugIcon } from "lucide-react"

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col items-center space-y-14 pt-20 pb-10 bg-accent">
      <NavItem title="Home" icon={<RiHomeFill />} href="/" />
      <NavItem title="Transactions" icon={<RiMoneyDollarCircleFill />} href="/transactions" />
      <NavItem title="Calendar" icon={<CalendarIcon />} href="/calendar" />
      <NavItem title="Connect" icon={<PlugIcon />} href="/connect" />
      <div className="grow"></div>
      <ThemeToggle />
    </div>
  )
}
