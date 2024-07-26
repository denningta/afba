import useBudgetOverview from "@/app/hooks/useBudgetOverview"
import { Button, Divider, Select, SelectItem } from "@tremor/react"
import { usePathname, useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

interface CopyBudgetFormProps {
  value?: string
  onChange?: (value: string) => void
  onClose?: () => void
  onSubmit?: (value: string) => void
}

const CopyBudgetForm = ({
  value,
  onChange = () => { },
  onClose = () => { },
  onSubmit = () => { }
}: CopyBudgetFormProps) => {
  const { data } = useBudgetOverview()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ month: string }>({
    defaultValues: {
      month: value
    }
  })

  return (
    <form
      onSubmit={handleSubmit((value) => onSubmit(value.month))}
    >
      <Controller
        name="month"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            name={field.name}
            onValueChange={(value) => {
              field.onChange(value ?? null);
            }}
          >
            {data && data.map((el, index) =>
              <SelectItem value={el.date} key={`${el.date}-${index}`}>
                {el.date + ' | Budget: $' + el.totalBudget}
              </SelectItem>
            )}
          </Select>
        )}
      />

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
          Copy Budget
        </Button>
      </div>
    </form>
  )

}

export default CopyBudgetForm
