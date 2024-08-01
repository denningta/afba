import { RiHomeFill, RiMoneyDollarCircleFill, RiPieChartFill, RiUploadCloudFill, RiUploadFill } from "@remixicon/react"
import NavItem from "./NavItem"

export default function Sidebar() {
  return (
    <div className="mt-6 text-tremor-brand-inverted">
      <NavItem title="Home" icon={<RiHomeFill />} href="/" />
      <NavItem title="Transactions" icon={<RiMoneyDollarCircleFill />} href="/transactions" />
      <NavItem title="Upload" icon={<RiUploadCloudFill />} href="/upload" />
    </div>
  )
}
