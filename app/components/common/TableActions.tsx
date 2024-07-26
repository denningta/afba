import { RiAddFill, RiCopyleftFill, RiDeleteBinFill, RiFileCopyFill } from "@remixicon/react";
import { Icon } from "@tremor/react";

export interface TableActionsProps {
  onAdd?: (...args: any) => void
  onDelete?: (...args: any) => void
  onCopyPrevMonth?: (...args: any) => void
  showAdd?: boolean
  showDelete?: boolean
  showCopyPrevMonth?: boolean
}

export default function TableActions({
  onAdd,
  onDelete,
  onCopyPrevMonth,
  showAdd = true,
  showDelete = true,
  showCopyPrevMonth = false
}: TableActionsProps) {

  return (
    <div className="flex justify-end space-x-3">
      {showCopyPrevMonth &&
        <Icon
          icon={RiFileCopyFill}
          tooltip="Copy From Previous Month"
          size="lg"
          className="cursor-pointer"
          onClick={onCopyPrevMonth}
        />
      }

      {showAdd &&
        <Icon
          icon={RiAddFill}
          tooltip="Add Record"
          size="lg"
          className="cursor-pointer"
          onClick={onAdd}
        />
      }

      {showDelete &&
        <Icon
          icon={RiDeleteBinFill}
          color="rose"
          tooltip="Delete Record"
          size="lg"
          className="cursor-pointer"
          onClick={onDelete}
        />
      }
    </div>
  )
}
