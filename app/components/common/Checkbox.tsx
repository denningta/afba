'use client'

import { useEffect, useRef } from "react"

export interface CheckboxProps {
  label?: string
  onChange?: (args: any) => void
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  tabIndex?: number
}

export default function Checkbox({
  label,
  onChange,
  checked = false,
  indeterminate = false,
  disabled = false,
  tabIndex = 0
}: CheckboxProps) {
  const checkbox = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!checkbox.current) return
    checkbox.current.indeterminate = indeterminate
  }, [checkbox, indeterminate])

  return (
    <>
      <input
        type="checkbox"
        ref={checkbox}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-tremor-brand bg-gray-100 border-gray-300 rounded  dark:bg-gray-700 dark:border-gray-600"
        tabIndex={tabIndex}
      />
      <label
        htmlFor="default-checkbox"
        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
      >
        {label}
      </label>
    </>
  )

}
