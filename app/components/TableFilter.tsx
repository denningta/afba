import { useEffect, useState } from "react"
import { Popper } from "@mui/base/Popper"
import { ClickAwayListener } from "@mui/base/ClickAwayListener"
import { Button } from "@tremor/react"
import { RiAddFill, RiArrowDownSLine, RiDeleteBinFill } from "@remixicon/react"
import FilterForm from "./FilterForm"
import { BuiltInFilterFn, Column, ColumnFilter, ColumnFiltersState, FilterFn, Row } from "@tanstack/react-table"
import useTableFilter from "../hooks/useTableFilter"

export interface TableFilterProps<T> {
  columns: Column<T, any>[]
  filterFns: FilterFn<T>[] | BuiltInFilterFn[]
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

const TableFilter = <T,>({
  columns,
  filterFns,
}: TableFilterProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const {
    filters,
    handleCreateFilter,
    handleUpdateFilter,
    handleDeleteFilter
  } = useTableFilter({ columns, filterFns })

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClickAway = () => {
    setAnchorEl(null)
  }

  const filterOpen = Boolean(anchorEl)
  const filterId = filterOpen ? 'simple-popper' : undefined

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div>
          <Button
            aria-describedby={filterId}
            className="rounded-lg bg-blue-500 text-white"
            type="button"
            onClick={handleClick}
          >
            <div className="flex items-center space-x-3">
              Filter
              <RiArrowDownSLine />
            </div>
          </Button>

          <Popper
            id={filterId}
            open={filterOpen}
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
                onClick={handleCreateFilter}
              >
                <RiAddFill />
                Add a filter condition
              </button>
            </div>
          </Popper>
        </div>
      </ClickAwayListener>



    </>
  )

}

export default TableFilter
