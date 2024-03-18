import Transaction from "@/app/interfaces/transaction"
import { Controller, useForm } from "react-hook-form"
import Label from "../common/Label"
import { Button, DatePicker, Divider, SearchSelect, SearchSelectItem, Switch, TextInput } from "@tremor/react"
import InputError from "../common/InputError"
import { useState } from "react"
import CurrencyInput from "react-currency-input-field"

export interface TransactionFormProps {
  onSubmit: (value: Transaction) => void
  onClose?: (args?: any) => void
  onChange?: (category: Transaction) => void
  initialValues?: Transaction
}

export default function TransactionForm({
  onSubmit,
  onClose,
  onChange,
  initialValues
}: TransactionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<Transaction>({
    defaultValues: initialValues
  })

  return (
    <form
      onSubmit={handleSubmit((value) => {
        if (value.amount) value.amount = +value.amount
        onSubmit(value)
      })}
      className="space-y-4">

      <div className="">
        <Label>Date</Label>
        <Controller
          name="date"
          control={control}
          render={(({ field }) =>
            <DatePicker
              value={field.value && new Date(field.value)}
              onValueChange={field.onChange}
            />
          )}
        />
        <InputError error={errors.date} />
      </div>

      <div>
        <Label>Description</Label>
        <TextInput
          {...register('description', { required: 'Description is required' })}
        />
        <InputError error={errors.description} />
      </div>

      <div>
        <Label>Original Description</Label>
        <TextInput
          {...register('originalDescription')}
        />
        <InputError error={errors.originalDescription} />
      </div>

      <div>
        <Label>Category</Label>
        <TextInput
          {...register('category')}
        />
        <InputError error={errors.category} />
      </div>

      <div>
        <Label>Budget Category</Label>
        <SearchSelect
          {...register('userCategoryId')}
        >
          <SearchSelectItem value="test">Test</SearchSelectItem>

        </SearchSelect>
        <InputError error={errors.userCategoryId} />
      </div>

      <div>
        <Label>Status</Label>
        <TextInput
          {...register('status')}
        />
        <InputError error={errors.status} />
      </div>

      <div className="grid grid-cols-3 gap-x-4">
        <div className="col-span-2">
          <Label>Amount</Label>
          <Controller
            name="amount"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CurrencyInput
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                className='mt-2 tremor-TextInput-root relative w-full flex items-center min-w-[10rem] outline-none rounded-tremor-default transition duration-100 border shadow-tremor-input dark:shadow-dark-tremor-input bg-tremor-background dark:bg-dark-tremor-background hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted text-tremor-content dark:text-dark-tremor-content border-tremor-border dark:border-dark-tremor-border'
                prefix="$"
              />

            )}
          />
          <InputError error={errors.amount} />
        </div>
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



    </form>
  )
}
