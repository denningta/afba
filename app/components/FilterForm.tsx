import { BuiltInFilterFn, Column, ColumnFiltersState, FilterFn } from "@tanstack/react-table"
import { TableFilterData } from "./TableFilter"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export interface FilterFormProps<T> {
  columns: Column<T>[]
  filterFns: FilterFn<T>[] | BuiltInFilterFn[]
  filterData: TableFilterData<T> | undefined
  onChange?: (filterData: TableFilterData<T> | undefined) => void
}

const FilterForm = <T,>({
  columns,
  filterFns,
  filterData,
  onChange = () => { }
}: FilterFormProps<T>) => {
  const [selectedCol, setSelectedCol] = useState<string | undefined>(undefined)


  const handleChange = (data: TableFilterData<T>) => {
    setSelectedCol(data.id)
    const updatedData: TableFilterData<T> = {
      id: data.id,
      ...filterData
    }

    if (data.id) {
      updatedData.column = columns.find((column) => column.id === data?.id)
    }

    if (data.value) {
      updatedData.value = data.value
    }

    if (data.filterFn) {
      updatedData.filterFn = data.filterFn
    }

    onChange(updatedData)
  }

  return (
    <>
      <Select
        name="columnId"
        value={filterData?.id}
        onValueChange={(id) => handleChange({ id: id })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Column" />
        </SelectTrigger>
        <SelectContent>
          {columns.map((column, index) =>
            <SelectItem
              value={column.id}
              key={index}
            >
              {column.id}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <Select
        name="filterFn"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          {filterFns.map((filterFn, index) =>
            <SelectItem
              key={index}
              value={filterFn as string}
            >
              {filterFn as string}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <Input
        placeholder="Enter a value"
        value={filterData?.value?.toString() ?? ''}
        onChange={(e) => handleChange({
          value: e.currentTarget.value
        })}
      />
    </>
  )

}

export default FilterForm
