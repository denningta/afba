import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import { RiMoreLine } from '@remixicon/react';
import { Popper } from '@mui/base/Popper'
import { useState } from 'react';

interface TableActionButtonProps {
  children: JSX.Element | JSX.Element[]
}

const TableActionButton = ({
  children,
}: TableActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const id = open ? 'table-action-popper' : undefined

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event?.currentTarget)
  }

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <div>
        <button
          onClick={handleClick}
        >
          <RiMoreLine />
        </button>
        <Popper
          id={id}
          open={open}
          anchorEl={anchorEl}
          className='bg-slate-800 text-white rounded border border-slate-700'
          placement='bottom-end'
          onClick={() => { setAnchorEl(null) }}
        >
          {children}
        </Popper>
      </div>
    </ClickAwayListener>
  )

}

export default TableActionButton
