'use client'

import { BuiltInFilterFn, ColumnDef, ColumnFiltersState, InitialTableState, Row, Table, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { isOdd } from "../helpers/helperFunctions"
import Checkbox from "./common/Checkbox"
import { Button, Dialog, DialogPanel, Divider, Select, SelectItem } from "@tremor/react"
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine, RiSettings2Fill } from "@remixicon/react"
import { useEffect, useState } from "react"
import Label from "./common/Label"
import DialogClose from "./common/DialogClose"
import TableFilter from "./TableFilter"
import TableFilterMenu from "./TableFilterMenu"
import CustomizeColumnsDialog from "./CustomizeColumnsDialog"
import { ArrowDown, ArrowUp } from "lucide-react"

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  initialState?: InitialTableState
  onRowClick?: (row: Row<T>) => void
  onLoad?: (table: Table<T>) => void
  customFilters?: React.ReactNode[]
  showFilter?: boolean
  showCustomizeButton?: boolean
}

const builtInFilterFns: BuiltInFilterFn[] = [
  'includesString',
  'includesStringSensitive',
  'equalsString',
  'arrIncludes',
  'arrIncludesAll',
  'arrIncludesSome',
  'equals',
  'weakEquals',
  'inNumberRange'
]


export default function BaseTable<T>({
  data,
  columns,
  initialState,
  onRowClick,
  onLoad,
  showFilter = true,
  showCustomizeButton = true
}: TableProps<T>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [showCustomize, setShowCustomize] = useState(false)

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    initialState: initialState,
    state: {
      columnFilters,
      pagination
    },
    autoResetPageIndex: false
  })

  useEffect(() => {
    onLoad && onLoad(table)
  }, [table])

  const rowStart = (pagination.pageIndex * pagination.pageSize) + 1
  const rowEnd = ((pagination.pageIndex + 1) * pagination.pageSize)
  const totalRows = data.length


  return (
    <div>
      <div className="flex items-center space-x-4">
        {showFilter &&
          <>
            <TableFilterMenu
              columns={table.getAllColumns()}
              filterFns={builtInFilterFns}
            />
          </>
        }

        {showCustomizeButton &&
          <CustomizeColumnsDialog table={table} />
        }
      </div>

      <div>
        <table className="w-full">
          <thead className="sticky top-0 bg-background uppercase mb-5">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="py-3 px-3 text-left">
                    <div
                      className={`flex items-center space-x-3 cursor-pointer select-none`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      <div className="w-6 text-accent ml-2">
                        {{
                          asc: <ArrowUp />,
                          desc: <ArrowDown />
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="dark:text-dark-tremor-content-emphasis">
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`h-10 cursor-pointer hover:bg-tremor-brand-muted/10 ${row.getIsSelected() && 'bg-tremor-brand-muted/30'} ${isOdd(i) ? 'bg-black/5 dark:bg-white/5' : 'dark-bg-dark-tremor-background-subtle'}`}
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
                {footerGroup.headers.map(header => {
                  console.log(footerGroup)
                  return (
                    <th key={header.id} className="py-3 pl-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                    </th>
                  )

                })}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {totalRows > pagination.pageSize &&
        <div className="space-x-3 flex justify-center items-center p-3">
          <div className="flex items-center space-x-3">
            <span>Rows</span>
            <Select
              value={pagination.pageSize.toString()}
              className="max-w-[80px] min-w-0"
              onValueChange={(value) => setPagination({
                ...pagination,
                pageSize: +value
              })}
            >
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </Select>
          </div>
          <div className="grow flex justify-center select-none">
            {`${rowStart} - ${rowEnd} of ${totalRows}`}
          </div>
          <Button
            icon={RiArrowLeftDoubleLine}
            color="stone"
            className="cursor-pointer"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <Button
            icon={RiArrowLeftSLine}
            color="stone"
            className="cursor-pointer"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <Button
            icon={RiArrowRightSLine}
            color="stone"
            className="cursor-pointer"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
          <Button
            icon={RiArrowRightDoubleLine}
            color="stone"
            className="cursor-pointer"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          />
        </div>
      }

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
    </div>
  )

}
