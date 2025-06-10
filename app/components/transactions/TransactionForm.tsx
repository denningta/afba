import Transaction from "@/app/interfaces/transaction"
import { useForm } from "react-hook-form"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export interface TransactionFormProps {
  onSubmit: (value: Transaction) => void
  onClose?: (args?: any) => void
  onChange?: (category: Transaction) => void
  initialValues?: Transaction
}

const formSchema = z.object({
  date: z.date(),
  description: z.string(),
  category: z.string(),
  status: z.string(),
  amount: z.number()
})

export default function TransactionForm({
  onSubmit,
  onClose,
  onChange,
  initialValues = {
    date: new Date(),
    description: '',
    category: '',
    status: '',
    amount: 0
  }
}: TransactionFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues
  })


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => {
            return (
              <FormItem>
                <div>
                  <FormLabel>Date</FormLabel>
                </div>
                <FormControl>
                  <DatePicker
                    date={new Date(field.value)}
                    onDateChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          }}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  {...form.register('amount', {
                    valueAsNumber: true
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <div className="flex justify-end space-x-6">
          <Button variant="secondary" tabIndex={-1} onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  )
}
