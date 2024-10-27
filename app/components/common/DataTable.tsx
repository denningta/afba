
import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  sortingFns,
  SortingFn,
  Table as TanstackTable,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
  getPaginationRowModel,
  Column,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  ColumnFiltersState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PlusCircle, Settings2Icon, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { DebouncedInput } from "./DebouncedInput"
import { compareItems, RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ColumnFilter from "./ColumnFilter"

declare module '@tanstack/react-table' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

interface DataTableProps<TData, TValue> {
  onLoad?: (table: TanstackTable<TData>) => void
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank,
  })

  return itemRank.passed
}

const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!
    )
  }

  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

export function DataTable<TData, TValue>({
  onLoad = () => { },
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      sorting,
      pagination
    },
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: 'fuzzy',
  })


  useEffect(() => {
    if (!table) return
    onLoad(table)
  }, [table])

  return (
    <>

      <div className="flex items-center justify-end mb-4 space-x-6 ">

        <div className="">
          <DebouncedInput
            placeholder="Quick search..."
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
          />
        </div>

        {table.getAllColumns().map((column: Column<TData, any>, i) => {
          if (column.getCanFilter() && column.columnDef.meta?.filterVariant) return (
            <div key={`column-filter-${i}`}>
              <ColumnFilter column={column} />
            </div>
          )
        })}

        {columnFilters.length > 0 &&
          <Button variant="ghost" onClick={() => setColumnFilters([])}>
            <div className="flex items-center space-x-3">
              <div>Reset</div>
              <X />
            </div>
          </Button>

        }


        <div className="grow" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="font-normal text-xs">
              <div className="flex items-center space-x-2">
                <Settings2Icon size={15} /> <div>View</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuItem>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toggleall"
                  checked={table.getIsAllColumnsVisible()}
                  onCheckedChange={table.getToggleAllColumnsVisibilityHandler()}
                />
                <label htmlFor="toggleall">Toggle all</label>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {table.getAllLeafColumns().map(column => {
              return (
                <DropdownMenuItem key={column.id}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(e) => column.toggleVisibility(e.valueOf() as boolean)}
                    />
                    <label
                      htmlFor={column.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {column.id}
                    </label>
                  </div>
                </DropdownMenuItem>
              )
            })}

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border " >

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                        <div className="grow" />

                        <div className="w-6 text-accent ml-2">
                          {{
                            asc: <ArrowUp />,
                            desc: <ArrowDown />
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div >

      <div className="flex items-center text-sm mt-4 mx-4 space-x-10">
        <div>0 of 4 rows(s) selected</div>

        <div className="grow" />

        <div className="flex items-center space-x-3">
          <div className="min-w-fit">
            Rows per page
          </div>
          <Select>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

        </div>
        <div>
          Page 1 of 1
        </div>
        <div>

          <Button
            variant="outline"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={15} />
          </Button>
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={15} />
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={15} />
          </Button>
          <Button
            variant="outline"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={15} />
          </Button>
        </div>
      </div>
    </>
  )
}
