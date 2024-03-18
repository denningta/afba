export interface LabelProps {
  children: JSX.Element | string
}
const Label = ({ children }: LabelProps) => {

  return (
    <label className="text-tremor-default font-bold text-tremor-content-strong dark:text-dark-tremor-content">
      {children}
    </label>
  )

}

export default Label
