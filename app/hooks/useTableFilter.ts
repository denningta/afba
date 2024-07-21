import { BuiltInFilterFn, Column, ColumnFiltersState, FilterFn } from "@tanstack/react-table"
import { TableFilterData, TableFilterRow } from "../components/TableFilter"
import { useEffect, useState } from "react"

export interface UseTableFilterProps<T> {
  columns: Column<T>[]
  filterFns: FilterFn<T>[] | BuiltInFilterFn[]
}

const useTableFilter = <T>({ columns, filterFns }: UseTableFilterProps<T>) => {
  const [filters, setFilters] = useState<TableFilterRow<T>[]>([])

  useEffect(() => {
    const tableFilters = retrieveLocalStorage()
    tableFilters.map(f => f.filterData.column?.setFilterValue(f.filterData.value))
    setFilters(tableFilters)
  }, [])

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

  const handleCreateFilter = () => {
    setFilters([
      ...filters,
      { index: filters.length }
    ])
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

  return {
    filters,
    handleCreateFilter,
    handleUpdateFilter,
    handleDeleteFilter
  }

}

export default useTableFilter
