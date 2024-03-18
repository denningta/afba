
interface MenuProps {
  children: JSX.Element[] | JSX.Element
  className?: string
  onClick?: () => void
  open?: boolean

}
const Menu = ({
  children,
  onClick,
  open = false
}: MenuProps) => {
  const childArray: JSX.Element[] = Array.isArray(children) ? children : [children]

  return (
    <div className={`absolute right-0 ${open ? 'block' : 'hidden'}`} onClick={onClick}>
      <div className="bg-tremor-background text-tremor-content dark:bg-dark-tremor-background dark:border dark:border-dark-tremor-border rounded">
        {childArray.map((el, i) =>
          <div key={i} className="hover:bg-tremor-background-subtle dark:hover:bg-dark-tremor-background-emphasis cursor-pointer p-3 rounded">
            {el}
          </div>
        )}
      </div>
    </div>
  )

}

export default Menu
