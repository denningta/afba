import { RiHomeFill, RiMoneyDollarCircleFill, RiPieChartFill, RiUploadCloudFill, RiUploadFill, RiLineChartFill, RemixiconComponentType } from "@remixicon/react"
import NavItem from "./NavItem"
import { ThemeToggle } from "./common/ThemeToggle"
import { CalendarIcon, CalendarX, MenuIcon, PlugIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import Link from "next/link"

export interface NavItemData {
  title: string
  icon: React.ReactElement
  href: string
}

const navItems: NavItemData[] = [
  {
    title: "Home",
    icon: <RiHomeFill />,
    href: "/"
  },
  {
    title: "Transactions",
    icon: <RiMoneyDollarCircleFill />,
    href: "/transactions"
  },
  {
    title: "Calendar",
    icon: <CalendarIcon />,
    href: "/calendar"

  },
  {
    title: "Balance",
    icon: <RiLineChartFill />,
    href: "/balance"
  },
  {
    title: "Connect",
    icon: <PlugIcon />,
    href: "/connect"
  }
]

export default function Sidebar() {
  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <div className="absolute top-5 right-5 md:hidden">
            <Button variant="ghost">
              <MenuIcon />
            </Button>
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <div className="flex flex-col items-center space-y-8 p-10">
            {navItems.map(navItem => (
              <Link href={navItem.href}>
                <Button variant="ghost" size="lg">
                  <div className="flex items-center space-x-4">
                    <span> {navItem.icon} </span>
                    <span>{navItem.title}</span>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
      <aside className="fixed top-0 left-0 h-screen w-20 z-40 hidden md:flex flex-col space-y-4 bg-tremor-brand dark:bg-dark-tremor-brand">
        <div className="h-full flex flex-col items-center space-y-14 pt-20 pb-10 bg-accent">
          {navItems.map(navItem => (
            <NavItem
              title={navItem.title}
              icon={navItem.icon}
              href={navItem.href}
            />
          ))}
          {/* <NavItem title="Home" icon={<RiHomeFill />} href="/" /> */}
          {/* <NavItem title="Transactions" icon={<RiMoneyDollarCircleFill />} href="/transactions" /> */}
          {/* <NavItem title="Calendar" icon={<CalendarIcon />} href="/calendar" /> */}
          {/* <NavItem title="Balance" icon={<RiLineChartFill />} href="/balance" /> */}
          {/* <NavItem title="Connect" icon={<PlugIcon />} href="/connect" /> */}
          <div className="grow"></div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
