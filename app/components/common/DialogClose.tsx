import { RiCloseFill } from "@remixicon/react"
import { Icon } from "@tremor/react"

export interface DialogCloseProps {
  onClick: () => void

}

const DialogClose = ({
  onClick = () => { }
}) => {
  return (
    <Icon
      icon={RiCloseFill}
      variant="simple"
      size="lg"
      color="neutral"
      className="absolute right-2 top-2 cursor-pointer"
      onClick={onClick}
    />
  )

}

export default DialogClose
