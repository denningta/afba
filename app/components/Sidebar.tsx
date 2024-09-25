import { RiHomeFill, RiMoneyDollarCircleFill, RiPieChartFill, RiUploadCloudFill, RiUploadFill } from "@remixicon/react"
import NavItem from "./NavItem"
import { ThemeToggle } from "./common/ThemeToggle"

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col items-center space-y-14 pt-20 pb-10 bg-accent">
      <NavItem title="Home" icon={<RiHomeFill />} href="/" />
      <NavItem title="Transactions" icon={<RiMoneyDollarCircleFill />} href="/transactions" />
      <NavItem title="Upload" icon={<RiUploadCloudFill />} href="/upload" />
      <div className="grow"></div>
      <ThemeToggle />
    </div>
  )
}
