import { RiMoreFill } from "@remixicon/react"
import { Icon } from "@tremor/react"
import { useState } from "react"
import Menu from "./Menu"
import { ClickAwayListener } from '@mui/base/ClickAwayListener';

interface TableActionButtonProps {
  children: JSX.Element | JSX.Element[]

}

const TableActionButton = ({
  children
}: TableActionButtonProps) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenuOpen = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
      <div>
        <Icon
          icon={RiMoreFill}
          className="cursor-pointer"
          color="slate"
          onClick={toggleMenuOpen}
        />

        <Menu
          open={menuOpen}
          onClick={() => setMenuOpen(false)}
        >
          {children}
        </Menu>
      </div>
    </ClickAwayListener>

  )

}

export default TableActionButton
