import { dateToYYYYMM } from '@/app/helpers/helperFunctions'
import { Category } from '@/app/interfaces/categories'
import { createFormFactory } from '@tanstack/react-form'
import { Button, Divider, NumberInput, TextInput } from '@tremor/react'


export const categoryFormFactory = createFormFactory<Category>({
  defaultValues: {
    date: new Date(),
    name: '',
    transactions: [],
    budget: 0
  }
})

export interface AddCategoryProps {
  onSubmit?: (args: any) => void
  onClose?: (args: any) => void
}

export default function AddCategory({
  onSubmit = () => { },
  onClose = () => { }
}: AddCategoryProps) {

  const form = categoryFormFactory.useForm({
    onSubmit: async ({ value }) => {
      onSubmit(value)
    }
  })

  return (
    <div>
      <div className="text-tremor-content-strong font-extrabold text-xl">Add Category</div>
      <form.Provider>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="grid grid-cols-1 gap-4">

            <Divider />

            <form.Field
              name="date"
              children={(field) => (
                <div>
                  <label htmlFor="date" className="text-tremor-default font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Month
                  </label>
                  <div className="mt-2 tremor-TextInput-root relative w-full flex items-center min-w-[10rem] outline-none rounded-tremor-default transition duration-100 border shadow-tremor-input dark:shadow-dark-tremor-input bg-tremor-background dark:bg-dark-tremor-background hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted text-tremor-content dark:text-dark-tremor-content border-tremor-border dark:border-dark-tremor-border">
                    <input
                      type="month"
                      id="date"
                      className="tremor-TextInput-input w-full focus:outline-none focus:ring-0 border-none bg-transparent text-tremor-default rounded-tremor-default transition duration-100 py-2 text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pl-3 pr-4 placeholder:text-tremor-content dark:placeholder:text-dark-tremor-content"
                      value={field.state.value && dateToYYYYMM(field.state.value)}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(new Date(e.target.value))}
                    />
                  </div>
                </div>
              )}
            />


            <form.Field
              name="name"
              children={(field) => (
                <div>
                  <label htmlFor="name" className="text-tremor-default font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Category Name
                  </label>
                  <TextInput
                    id="name"
                    className='mt-2'
                    value={field.state.value}
                    placeholder='Ex: Rent...'
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />


            <form.Field
              name="budget"
              children={(field) => (
                <div>
                  <label htmlFor="budget" className="text-tremor-default font-extrabold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Budget
                  </label>
                  <div className='mt-2 relative flex items-center'>
                    <span className="absolute left-3 z-[40] ">$</span>
                    <NumberInput
                      value={field.state.value}
                      className='pl-3'
                      placeholder=''
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(+e.target.value)}
                    />
                  </div>
                </div>
              )}
            />

            <Divider />

          </div>
          <div className='flex justify-end space-x-3'>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Add Category
            </Button>
          </div>
        </form>
      </form.Provider>
    </div>
  )

}
