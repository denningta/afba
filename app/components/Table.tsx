'use client'

import { ColumnDef, InitialTableState, Row, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { isOdd } from "../helpers/helperFunctions"
import Checkbox from "./common/Checkbox"
import { Button, Dialog, DialogPanel, Divider, Icon } from "@tremor/react"
import { RiCloseFill, RiSettings2Fill } from "@remixicon/react"
import { useState } from "react"
import Label from "./common/Label"
import DialogClose from "./common/DialogClose"

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  initialState?: InitialTableState
  onRowClick?: (row: Row<T>) => void
}

export default function Table<T>({
  data,
  columns,
  initialState,
  onRowClick
}: TableProps<T>) {
  const table = useReactTable<T>({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    initialState: initialState
  })

  const [showCustomize, setShowCustomize] = useState(false)

  return (
    <div>
      <div className="flex items-center">
        <Button
          variant="secondary"
          icon={RiSettings2Fill}
          onClick={() => setShowCustomize(true)}
        >
          Customize
        </Button>
      </div>

      <Dialog
        open={showCustomize}
        onClose={() => setShowCustomize(false)}
      >
        <DialogPanel>
          <DialogClose onClick={() => setShowCustomize(false)} />
          <div className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-extrabold text-xl">
            Table Settings
          </div>
          <Divider />

          <div className=" mb-2">
            <Label>Column Visibility</Label>
          </div>
          <label className="mb-1">
            <Checkbox
              {...{
                type: 'checkbox',
                checked: table.getIsAllColumnsVisible(),
                onChange: table.getToggleAllColumnsVisibilityHandler(),
              }}
            />{' '}
            Toggle All
          </label>
          {table.getAllLeafColumns().map(column => {
            return (
              <div key={column.id} className="px-1">
                <label>
                  <Checkbox
                    {...{
                      type: 'checkbox',
                      checked: column.getIsVisible(),
                      onChange: column.getToggleVisibilityHandler(),
                    }}
                  />{' '}
                  {column.id}
                </label>
              </div>
            )
          })}
        </DialogPanel>
      </Dialog>

      <table className="w-full">
        <thead className="dark:text-dark-tremor-content-muted uppercase border-b border-tremor-border mb-5">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="py-3 px-3 text-left">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="dark:text-dark-tremor-content-emphasis">
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`h-10 cursor-pointer hover:bg-tremor-brand-muted/70 ${row.getIsSelected() && 'bg-tremor-brand-muted/30'} ${isOdd(i) ? 'bg-black/5 dark:bg-white/5' : 'dark-bg-dark-tremor-background-subtle'}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`h-12`}
                >
                  <div className="pl-3 line-clamp-1 h-full flex items-center">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map(footerGroup => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                    )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  )

}
