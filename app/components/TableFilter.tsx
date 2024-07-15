import { useEffect, useState } from "react"
import { Popper } from "@mui/base/Popper"
import { ClickAwayListener } from "@mui/base/ClickAwayListener"
import { Button } from "@tremor/react"
import { RiAddFill, RiArrowDownSLine, RiDeleteBinFill } from "@remixicon/react"
import FilterForm from "./FilterForm"
import { Column, ColumnFilter, ColumnFiltersState } from "@tanstack/react-table"

export interface FilterButtonProps<T> {
  columns: Column<T>[]
  filterFns: ColumnFiltersState
}

export interface TableFilterRow<T> {
  index: number
  filterData?: TableFilterData<T>
}

export interface TableFilterData<T> {
  id?: string
  column?: Column<T>
  filterFn?: ColumnFilter
  value?: string | number
}

const TableFilter = <T,>({ columns, filterFns }: FilterButtonProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filters, setFilters] = useState<TableFilterRow<T>[]>([])
  console.log(filters)

  useEffect(() => {
    const tableFilters = retrieveLocalStorage()
    tableFilters.map(f => f.filterData.column?.setFilterValue(f.filterData.value))
    setFilters(tableFilters)
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClickAway = () => {
    setAnchorEl(null)
  }

  const setLocalStorage = (tableFilters: TableFilterRow<T>[]) => {
    const tableFiltersStorage = tableFilters.map(({ index, filterData }) => ({
      index: index,
      filterData: {
        id: filterData?.id,
        value: filterData?.value
      }
    }))
    localStorage.setItem('tableFilters', JSON.stringify(tableFiltersStorage))
  }

  const retrieveLocalStorage = () => {
    const tableFiltersString = localStorage.getItem('tableFilters')
    if (!tableFiltersString) return []
    const tableFilters = JSON.parse(tableFiltersString) as TableFilterRow<T>[]

    return tableFilters.map(f => {
      return {
        index: f.index,
        filterData: {
          ...f.filterData,
          column: columns.find(col => col.id === f.filterData?.id)
        }
      }
    })
  }

  const handleDeleteFilter = (filter: TableFilterRow<T>) => {
    const updatedFilters = filters.filter(f => f.index !== filter.index)
    filter.filterData?.column?.setFilterValue(undefined)
    setLocalStorage(updatedFilters)
    setFilters(updatedFilters)
  }

  const handleUpdateFilter = (index: number, filterData: TableFilterData<T> | undefined) => {
    const updatedFilters = filters.map(filter =>
      filter.index === index ? {
        ...filter,
        filterData: {
          id: filterData?.column?.id,
          column: filterData?.column,
          value: filterData?.value
        }
      } : filter
    )

    filterData?.column?.setFilterValue(filterData.value)
    setLocalStorage(updatedFilters)
    setFilters(updatedFilters)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popper' : undefined


  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div>
        <Button
          aria-describedby={id}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
          type="button"
          onClick={handleClick}
        >
          <div className="flex items-center space-x-3">
            Filter
            <RiArrowDownSLine />
          </div>
        </Button>

        <Popper
          id={id}
          open={open}
          anchorEl={anchorEl}
          className="m-1 dark:bg-dark-tremor-background rounded p-4 border border-gray-500 shadow"
          placement="bottom-start"
        >
          <div className="space-y-3">
            {filters && filters.length > 0 ? filters.map((filter, index) =>
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
                  <RiDeleteBinFill />
                </button>
              </div>
            ) : <div>No filters have been applied</div>}
            <button
              type="button"
              className="flex items-center space-x-3"
              onClick={() => setFilters([
                ...filters,
                { index: filters.length }
              ])}
            >
              <RiAddFill />
              Add a filter condition
            </button>
          </div>
        </Popper>
      </div>
    </ClickAwayListener>

  )

}

export default TableFilter
