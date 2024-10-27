import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Column, RowData } from "@tanstack/react-table"
import { PlusCircle } from "lucide-react"
import { useMemo } from "react"

export interface ColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select'
  }
}


const ColumnFilter = <TData, TValue>({ column }: ColumnFilterProps<TData, TValue>) => {
  const columnFilterValue: any = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}




  const sortedUniqueValues = useMemo(() =>
    filterVariant === 'range'
      ? []
      : Array.from(column.getFacetedUniqueValues().keys())
        .sort()
        .slice(0, 5000),
    [column.getFacetedUniqueValues(), filterVariant]
  )

  const userCategoryUniqueValues = useMemo(() => {
    if (column.id !== 'userCategory') return
    const facets = column.getFacetedUniqueValues()
    const nameFacets = new Map()

    facets.forEach((value, key) => {
      if (key === undefined) {
        nameFacets.set('unassigned', value)
      } else {
        nameFacets.has(key.name)
          ? nameFacets.set(key.name, nameFacets.get(key.name) + 1)
          : nameFacets.set(key.name, 1)
      }
    })
    return Array.from(nameFacets.keys()).sort().slice(0, 5000)
  }, [column.getFacetedUniqueValues(), filterVariant])

  if (filterVariant === 'select') {
    return (
      <div>
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="font-normal text-xs">
              <div className="space-x-2 flex items-center h-full">
                <PlusCircle size={15} />
                <span>{column.columnDef.header as string}</span>
                {column.getFilterValue() as string &&
                  <>
                    <Separator orientation="vertical" />
                    <div className="bg-accent p-1 px-2 rounded">{column.getFilterValue() as string}</div>
                  </>
                }
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <Select
              onValueChange={value => column.setFilterValue(value === "all" ? "" : value)}
              value={columnFilterValue?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${column.columnDef.header}`}></SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    All
                  </SelectItem>
                  {sortedUniqueValues.map((value, i) => {
                    if (typeof value === 'string') return <SelectItem value={value} key={value}>{value}</SelectItem>
                  })}
                  {column.id === 'userCategory' && userCategoryUniqueValues &&
                    userCategoryUniqueValues.map((value, i) => (
                      <SelectItem value={value} key={value}>{value}</SelectItem>

                    ))

                  }
                </SelectGroup>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
}

export default ColumnFilter
