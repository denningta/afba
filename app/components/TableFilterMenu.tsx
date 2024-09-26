import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import useTableFilter from "../hooks/useTableFilter"
import { BuiltInFilterFn, Column, FilterFn } from "@tanstack/react-table"
import { SquarePlus, Trash2 } from "lucide-react"
import FilterForm from "./FilterForm"
import { Button } from "@/components/ui/button"

export interface TableFilterProps<T> {
  columns: Column<T, any>[]
  filterFns: FilterFn<T>[] | BuiltInFilterFn[]
}

const TableFilterMenu = <T,>({ columns, filterFns }: TableFilterProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const {
    filters,
    handleCreateFilter,
    handleUpdateFilter,
    handleDeleteFilter
  } = useTableFilter({ columns, filterFns })

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Filter</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Add filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-3">
            {filters && filters.length > 0 && filters.map((filter, index) =>
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <div className="flex items-center space-x-3" key={index}>
                  <FilterForm
                    columns={columns}
                    filterFns={filterFns}
                    filterData={filter.filterData}
                    onChange={(filterData) => handleUpdateFilter(index, filterData)}
                  />
                  <button
                    onClick={() => handleDeleteFilter(filter)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => e.preventDefault()}>
              <button
                type="button"
                className="flex items-center space-x-3"
                onClick={handleCreateFilter}
              >
                <SquarePlus />
                Add a filter condition
              </button>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )



}

export default TableFilterMenu
