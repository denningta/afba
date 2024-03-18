import { Category } from "@/app/interfaces/categories"
import { Button, Divider, TextInput } from "@tremor/react"
import CurrencyInput from "react-currency-input-field"
import { Controller, useForm } from "react-hook-form"
import Label from "../common/Label"
import InputError from "../common/InputError"


export interface CategoryFormProps {
  onSubmit: (value: Category) => void
  onClose?: (args?: any) => void
  onChange?: (category: Category) => void
  initialValues?: Category
}

export default function CategoryForm({
  onSubmit,
  onClose,
  initialValues
}: CategoryFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Category>({
    defaultValues: initialValues
  })

  return (
    <form
      onSubmit={handleSubmit((value) => {
        if (value.budget) value.budget = +value.budget
        onSubmit(value)
      })}
    >
      <div className="space-y-4">
        <div>
          <Label>Month</Label>
          <input
            {...register('date', { required: 'Month is requred' })}
            type="month"
            className="tremor-TextInput-input w-full focus:outline-none focus:ring-0 border-none bg-transparent text-tremor-default rounded-tremor-default transition duration-100 py-2 text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-3 pr-4 placeholder:text-tremor-content dark:placeholder:text-dark-tremor-content"
          />
          <InputError error={errors.date} />
        </div>

        <div>
          <Label>Name</Label>
          <TextInput
            {...register('name', { required: 'Name is required' })}
            placeholder=""
          />
          <InputError error={errors.name} />
        </div>


        <div>
          <Label>Budget</Label>
          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                name={field.name}
                onValueChange={(value) => {
                  field.onChange(value ?? null);
                }}
                className='mt-2 tremor-TextInput-root relative w-full flex items-center min-w-[10rem] outline-none rounded-tremor-default transition duration-100 border shadow-tremor-input dark:shadow-dark-tremor-input bg-tremor-background dark:bg-dark-tremor-background hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted text-tremor-content dark:text-dark-tremor-content border-tremor-border dark:border-dark-tremor-border'
                prefix='$'
                decimalsLimit={2}
                allowNegativeValue={false}
              />
            )}
          />
          <InputError error={errors.budget} />
        </div>

        <Divider />
        <div className='flex justify-end space-x-3'>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  )

}
