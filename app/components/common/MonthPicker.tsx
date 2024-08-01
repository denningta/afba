import { ChangeEventHandler } from "react"

export interface MonthPickerProps {
  value: string | number | undefined
  onChange: ChangeEventHandler<HTMLInputElement>
}

const MonthPicker = ({
  value,
  onChange
}: MonthPickerProps) => {

  return (
    <input
      type="month"
      value={value}
      onChange={onChange}
      className="tremor-TextInput-input w-full focus:outline-none focus:ring-0 border-none bg-transparent text-tremor-default rounded-tremor-default transition duration-100 py-2 text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-3 pr-4 placeholder:text-tremor-content dark:placeholder:text-dark-tremor-content"
    />
  )
}

export default MonthPicker
