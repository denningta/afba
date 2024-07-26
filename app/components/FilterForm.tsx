import { BuiltInFilterFn, Column, ColumnFiltersState, FilterFn } from "@tanstack/react-table"
import { Select, SelectItem, TextInput } from "@tremor/react"
import { TableFilterData } from "./TableFilter"
import { useState } from "react"

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
        id="columnId"
        name="columnId"
        value={filterData?.id}
        placeholder="Select column"
        onValueChange={(id) => handleChange({ id: id })}
      >
        {columns.map((column, index) =>
          <SelectItem
            value={column.id}
            key={index}
          >
            {column.id}
          </SelectItem>
        )}
      </Select>
      <>
        <Select
          id="filterFn"
          name="filterFn"
          placeholder="Select operator"
        >
          {filterFns.map((filterFn, index) =>
            <SelectItem
              key={index}
              value={filterFn as string}
            >
              {filterFn as string}
            </SelectItem>
          )}
        </Select>
        <TextInput
          placeholder="Enter a value"
          value={filterData?.value?.toString() ?? ''}
          onChange={(e) => handleChange({
            value: e.currentTarget.value
          })}
        >
        </TextInput>
      </>
    </>
  )

}

export default FilterForm
