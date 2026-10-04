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
  count?: number
  // Shown in place of the count, e.g. a formatted total.
  detail?: string
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

  const selected = (column.getFilterValue() as string | undefined) || undefined
  const facets = column.getFacetedUniqueValues()
  const groups = useMemo(
    () => filterVariant === 'select' ? (filterOptions ?? defaultFilterOptions)(facets) : [],
    [facets, filterOptions, filterVariant]
  )

  if (filterVariant !== 'select') return null

  return (
    <FilterPopover
      title={column.columnDef.header as string}
      groups={groups}
      selected={selected ? [selected] : []}
      onSelect={value => column.setFilterValue(value === selected ? undefined : value)}
      onClear={() => column.setFilterValue(undefined)}
    />
  )
}

export interface FilterPopoverProps {
  title: string
  groups: FilterOptionGroup[]
  selected: string[]
  // Called with the option picked; the caller decides whether that replaces
  // or toggles the selection.
  onSelect: (value: string) => void
  onClear: () => void
  // Keep the list open after a pick, for choosing several values.
  multiple?: boolean
  align?: 'start' | 'end'
}

// The dashed "+ Title" button and searchable, grouped option list used by the
// table toolbars. Works without a table, e.g. to pick a chart's series.
export function FilterPopover({ title, groups, selected, onSelect, onClear, multiple, align = 'start' }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const labelFor = (value: string) =>
    groups.flatMap(group => group.options).find(option => option.value === value)?.label ?? value
  const isSelected = (value: string) => selected.includes(value)

  const choose = (value: string) => {
    onSelect(value)
    if (!multiple) setOpen(false)
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
          {selected.length > 0 &&
            <>
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
              {selected.length > 2
                ? <Badge variant="secondary" className="rounded-sm font-normal">{selected.length} selected</Badge>
                : selected.map(value => (
                  <Badge key={value} variant="secondary" className="max-w-32 rounded-sm font-normal">
                    <span className="truncate">{labelFor(value)}</span>
                  </Badge>
                ))
              }
            </>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 p-0">
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
                        data-checked={isSelected(option.value)}
                      >
                        <span className="truncate">{option.label}</span>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{option.detail ?? option.count}</span>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )
            })}
            {selected.length > 0 &&
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__clear" onSelect={() => { onClear(); setOpen(false) }} className="justify-center">
                    {multiple ? 'Clear selection' : 'Clear filter'}
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
