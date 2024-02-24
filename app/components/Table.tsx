'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { isOdd } from "../helpers/helperFunctions"

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
}

export default function Table<T>({ data, columns }: TableProps<T>) {
  const table = useReactTable<T>({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnPinning: {
        left: ['select']
      }
    }
  })


  return (
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
            className={`h-10 hover:bg-tremor-brand-muted/70 ${row.getIsSelected() && 'bg-tremor-brand-muted/30'} ${isOdd(i) ? 'bg-black/5 dark:bg-white/5' : 'dark-bg-dark-tremor-background-subtle'}`}
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

  )

}
