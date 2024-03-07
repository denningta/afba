import { RiAddFill, RiDeleteBinFill } from "@remixicon/react";
import { Icon } from "@tremor/react";

export interface TableActionsProps {
  onAdd?: (...args: any) => void
  onDelete?: (...args: any) => void
}

export default function TableActions({
  onAdd,
  onDelete
}: TableActionsProps) {

  return (
    <div className="flex justify-end space-x-3">
      <Icon
        icon={RiDeleteBinFill}
        color="rose"
        tooltip="Delete Record"
        size="lg"
        className="cursor-pointer"
        onClick={onDelete}
      />

      <Icon
        icon={RiAddFill}
        tooltip="Add Record"
        size="lg"
        className="cursor-pointer"
        onClick={onAdd}
      />
    </div>
  )
}
