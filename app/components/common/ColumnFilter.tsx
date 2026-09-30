import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Column, RowData } from "@tanstack/react-table"
import { ChevronDownIcon, PlusCircle } from "lucide-react"
import { useMemo, useState } from "react"

export interface FilterOption {
  // What the column filter is set to; `label` is what the user sees.
  value: string
  label: string
  count: number
}

export interface FilterOptionGroup {
  heading?: string
  options: FilterOption[]
  // Hidden behind a "Show …" item until expanded or the user searches.
  collapsed?: boolean
}

export interface ColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select'
    // Turns the column's faceted values (value -> row count, already narrowed
    // by the other filters) into the options offered. Defaults to the distinct
    // string values in alphabetical order.
    filterOptions?: (facets: Map<any, number>) => FilterOptionGroup[]
  }
}

const defaultFilterOptions = (facets: Map<any, number>): FilterOptionGroup[] => [{
  options: Array.from(facets.entries())
    .filter(([value]) => typeof value === 'string' && value)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label)),
}]

const ColumnFilter = <TData, TValue>({ column }: ColumnFilterProps<TData, TValue>) => {
  const { filterVariant, filterOptions } = column.columnDef.meta ?? {}
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const selected = (column.getFilterValue() as string | undefined) || undefined
  const facets = column.getFacetedUniqueValues()
  const groups = useMemo(
    () => filterVariant === 'select' ? (filterOptions ?? defaultFilterOptions)(facets) : [],
    [facets, filterOptions, filterVariant]
  )

  if (filterVariant !== 'select') return null

  const title = column.columnDef.header as string
  const selectedLabel = selected &&
    (groups.flatMap(group => group.options).find(option => option.value === selected)?.label ?? selected)

  const choose = (value: string) => {
    column.setFilterValue(value === selected ? undefined : value)
    setOpen(false)
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch('')
      setExpanded(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed font-normal">
          <PlusCircle />
          <span>{title}</span>
          {selectedLabel &&
            <>
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
              <Badge variant="secondary" className="rounded-sm font-normal">{selectedLabel}</Badge>
            </>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}…`} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {groups.map((group, i) => {
              if (!group.options.length) return null
              // Searching always covers every option, collapsed or not.
              const hidden = group.collapsed && !expanded && !search
              return (
                <CommandGroup key={group.heading ?? i} heading={hidden ? undefined : group.heading}>
                  {hidden
                    ? (
                      <CommandItem value={`__show-${group.heading}`} onSelect={() => setExpanded(true)} className="text-muted-foreground">
                        <ChevronDownIcon />
                        Show {group.heading?.toLowerCase() ?? 'more'} ({group.options.length})
                      </CommandItem>
                    )
                    : group.options.map(option => (
                      <CommandItem
                        key={option.value}
                        // cmdk matches on `value`; include the label so search finds it.
                        value={`${option.label} ${option.value}`}
                        onSelect={() => choose(option.value)}
                        data-checked={option.value === selected}
                      >
                        <span className="truncate">{option.label}</span>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{option.count}</span>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )
            })}
            {selected &&
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__clear" onSelect={() => { column.setFilterValue(undefined); setOpen(false) }} className="justify-center">
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            }
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ColumnFilter
