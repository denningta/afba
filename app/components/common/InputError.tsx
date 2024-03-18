import { FieldError } from "react-hook-form"

export interface InputErrorProps {
  error: FieldError | undefined

}

const InputError = ({ error }: InputErrorProps) => {
  return (
    <div className="h-3 text-xs text-rose-600">
      {error &&
        <em>
          {error.message}
        </em>
      }
    </div>
  )

}

export default InputError
