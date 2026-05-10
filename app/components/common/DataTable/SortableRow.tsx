import { TableCell, TableRow } from "@/components/ui/table";
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react";

interface DraggableItem {
  id: string | number
}

interface SortableRowProps<T extends DraggableItem> extends React.ComponentPropsWithoutRef<typeof TableRow> {
  item: T
}


export default function SortableRow<T extends DraggableItem>({ item, ...props }: SortableRowProps<T>) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'default',
    zIndex: isDragging ? 10 : 0, // Keep the dragged row on top
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...props}
    >
      <TableCell className="w=[40px] p-0 text-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>


    </TableRow>
  )

}

