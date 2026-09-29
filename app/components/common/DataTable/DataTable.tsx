
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
  VisibilityState,
  RowSelectionState,
  OnChangeFn,
  RowData,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SearchIcon, Settings2Icon, X } from "lucide-react"
import { DebouncedInput } from "../DebouncedInput"
import { compareItems, RankingInfo, rankItem } from "@tanstack/match-sorter-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ColumnFilter from "../ColumnFilter"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import useColumnVisibility from "@/app/hooks/useColumnVisibility"
import { EmptyState, ErrorState } from "../StateMessage"

declare module '@tanstack/react-table' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
  interface ColumnMeta<TData extends RowData, TValue> {
    // Numeric columns set 'right' so amounts line up.
    align?: 'left' | 'right' | 'center'
    // Fixed column width in px; columns without one share the remaining space.
    width?: number
    // Clip long text with an ellipsis (full text in the tooltip).
    truncate?: boolean
  }
}

const alignClass = {
  left: '',
  right: 'text-right',
  center: 'text-center',
}

const PAGE_SIZES = [20, 50, 100]

// Extra padding on the outer columns so content doesn't hug the card border.
const edgePadding = "first:pl-4 last:pr-4"

// Column picker label: the header text when it's a plain string, else the id.
function columnLabel(column: Column<any, unknown>) {
  const { header } = column.columnDef
  return typeof header === 'string' ? header : column.id
}

interface DataTableProps<TData, TValue> {
  onLoad?: (table: TanstackTable<TData>) => void
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  isLoading?: boolean
  // Each table should pass its own key so column choices don't leak between tables.
  columnVisibilityStorageKey?: string
  // Applied until the user changes a column; saved choices win for the columns they cover.
  defaultColumnVisibility?: VisibilityState
  // Controlled visibility, for tables that share column choices (see
  // useColumnVisibility). When set, the storage key/defaults above are ignored.
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  // A failed load replaces the table with an error message (and Retry when
  // onRetry is given) instead of an empty table that looks like "no data".
  error?: unknown
  onRetry?: () => void
  // Shown when there are no rows at all (as opposed to rows hidden by filters).
  emptyState?: React.ReactNode
  // Extra buttons shown in the toolbar, left of the View menu.
  toolbarActions?: React.ReactNode
  // Buttons acting on the selected rows, shown in the toolbar while any are selected.
  selectionActions?: (rows: TData[], clearSelection: () => void) => React.ReactNode
  // Stable row ids keep the selection on the same rows when others are removed
  // (without it, selection is by index).
  getRowId?: (row: TData) => string
  // 'minimal' drops the toolbar and the row-count/pagination bar, for short
  // tables that sit alongside a full one.
  variant?: 'full' | 'minimal'
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
  isLoading = false,
  columnVisibilityStorageKey = 'colVis',
  defaultColumnVisibility = {},
  toolbarActions,
  selectionActions,
  getRowId,
  variant = 'full',
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  error,
  onRetry,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const controlled = controlledVisibility !== undefined
  const [ownVisibility, setOwnVisibility] = useColumnVisibility(
    controlled ? null : columnVisibilityStorageKey,
    defaultColumnVisibility
  )
  const columnVisibility = controlledVisibility ?? ownVisibility
  const setColumnVisibility = onColumnVisibilityChange ?? setOwnVisibility
  const [mounted, setMounted] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  })
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlFilters: ColumnFiltersState = []
    if (!searchParams.keys()) return
    searchParams.keys().forEach(key => {
      urlFilters.push({
        id: key,
        value: searchParams.get(key)
      })
    })

  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])




  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      sorting,
      pagination,
      rowSelection
    },
    filterFns: {
      fuzzy: fuzzyFilter
    },
    autoResetPageIndex: false,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
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
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'fuzzy',
  })


  useEffect(() => {
    if (!table) return
    onLoad(table)
  }, [table])


  const hasFooter = columns.some(column => column.footer)
  const selectable = table.getAllLeafColumns().some(column => column.id === 'select')
  const selectedCount = Object.keys(rowSelection).length
  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()

  return (
    <div className="space-y-3">
      {variant === 'full' &&
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <DebouncedInput
            className="pl-8"
            placeholder="Search..."
            aria-label="Search table"
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
          />
        </div>

        {table.getAllColumns().map((column: Column<TData, any>, i) => {
          if (column.getCanFilter() && column.columnDef.meta?.filterVariant) return (
            <ColumnFilter key={`column-filter-${i}`} column={column} />
          )
        })}

        {columnFilters.length > 0 &&
          <Button variant="ghost" onClick={() => setColumnFilters([])}>
            Reset
            <X />
          </Button>
        }

        <div className="ml-auto flex items-center gap-2">
        {selectionActions && selectedCount > 0 &&
          selectionActions(
            table.getSelectedRowModel().rows.map(row => row.original),
            () => table.resetRowSelection()
          )
        }
        {toolbarActions}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings2Icon />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={table.getIsAllColumnsVisible()}
              onCheckedChange={value => table.toggleAllColumnsVisible(!!value)}
              onSelect={e => e.preventDefault()}
            >
              Show all
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={value => column.toggleVisibility(!!value)}
                onSelect={e => e.preventDefault()}
              >
                {columnLabel(column)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      }

      <div className="overflow-hidden rounded-lg border bg-card">
        {error ? <ErrorState error={error} onRetry={onRetry} /> : isLoading ?
          <div className="flex flex-col space-y-3 p-4">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>

          :

          // On desktop the table scrolls inside this box so the header (and
          // totals footer) stay pinned; on mobile the page scrolls normally.
          <Table containerClassName="md:max-h-[calc(100dvh-12rem)] md:overflow-y-auto">
            <TableHeader className="[&_tr]:border-b-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const align = header.column.columnDef.meta?.align ?? 'left'
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                        style={{ width: header.column.columnDef.meta?.width }}
                        className={cn(
                          // Opaque muted/card mix, so rows don't show through the
                          // sticky header. Inset shadow
                          // instead of a border: collapsed borders don't travel
                          // with sticky cells.
                          "sticky top-0 z-10 bg-[color-mix(in_oklab,var(--muted)_60%,var(--card))] px-3 text-xs font-medium text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]",
                          edgePadding,
                          alignClass[align]
                        )}
                      >
                        {header.isPlaceholder ? null :
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              align === 'right' && "flex-row-reverse",
                              canSort && "cursor-pointer select-none hover:text-foreground"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              sorted === 'asc' ? <ArrowUp className="size-3.5 text-foreground" /> :
                                sorted === 'desc' ? <ArrowDown className="size-3.5 text-foreground" /> :
                                  <ArrowUpDown className="size-3.5 opacity-40" />
                            )}
                          </div>
                        }
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-border/60 hover:bg-muted/40 data-[state=selected]:bg-primary/8"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta
                      const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                      const value = cell.getValue()
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "h-11 px-3 py-2",
                            edgePadding,
                            meta?.align === 'right' && "text-right tabular-nums",
                            meta?.align === 'center' && "text-center",
                          )}
                        >
                          {meta?.truncate
                            ? <div className="max-w-[18rem] truncate" title={typeof value === 'string' ? value : undefined}>{content}</div>
                            : content}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0 whitespace-normal">
                    {data.length === 0
                      ? emptyState ?? <EmptyState title="Nothing here yet" />
                      : <EmptyState
                        title="No matching rows"
                        description="Nothing matches the current search or filters."
                        action={
                          <Button variant="outline" onClick={() => { setGlobalFilter(''); setColumnFilters([]) }}>
                            Clear search and filters
                          </Button>
                        }
                      />
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {hasFooter &&
              <TableFooter className="border-t-0 bg-transparent">
                {table.getFooterGroups().map(footerGroup => (
                  <TableRow key={footerGroup.id} className="hover:bg-transparent">
                    {footerGroup.headers.map(header => (
                      <TableCell
                        key={header.id}
                        className={cn(
                          "sticky bottom-0 bg-[color-mix(in_oklab,var(--muted)_60%,var(--card))] px-3 py-3 shadow-[inset_0_1px_0_var(--border)]",
                          edgePadding,
                          header.column.columnDef.meta?.align === 'right' && "text-right tabular-nums",
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableFooter>
            }
          </Table>

        }

      </div>

      {variant === 'full' &&
      <div className="flex flex-col-reverse gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="sm:mr-auto">
          {selectable && selectedCount > 0
            ? `${selectedCount} of ${filteredCount} row(s) selected`
            : `${filteredCount.toLocaleString()} row(s)`}
        </div>

        {data.length > PAGE_SIZES[0] &&
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Rows per page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={value => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[72px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(size => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="whitespace-nowrap">
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(pageCount, 1).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="First page"
                onClick={() => table.firstPage()}
                disabled={!mounted || !table.getCanPreviousPage()}
              >
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                onClick={() => table.previousPage()}
                disabled={!mounted || !table.getCanPreviousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                onClick={() => table.nextPage()}
                disabled={!mounted || !table.getCanNextPage()}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Last page"
                onClick={() => table.lastPage()}
                disabled={!mounted || !table.getCanNextPage()}
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        }
      </div>
      }
    </div>
  )
}
