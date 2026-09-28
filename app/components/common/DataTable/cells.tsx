'use client'

import { Row, Table } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

// Placeholder for a missing value, so empty cells read as intentional.
export function EmptyCell() {
  return <span className="text-muted-foreground/60">—</span>
}

export function SelectAllCheckbox<TData>({ table }: { table: Table<TData> }) {
  return (
    <Checkbox
      aria-label="Select all rows"
      className="data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
      checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && "indeterminate")}
      onCheckedChange={value => table.toggleAllRowsSelected(!!value)}
      tabIndex={-1}
    />
  )
}

export function SelectRowCheckbox<TData>({ row }: { row: Row<TData> }) {
  return (
    <Checkbox
      aria-label="Select row"
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={value => row.toggleSelected(!!value)}
      tabIndex={-1}
    />
  )
}
