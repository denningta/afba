import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MonthPicker from "@/components/ui/month-picker"
import { Category } from "@/app/interfaces/categories"
import useCategories from "@/app/hooks/useCategories"
import { dateToYYYYMM, YYYYMMToDate } from "@/app/helpers/helperFunctions"
import { useParams } from "next/navigation"

const formSchema = z.object({
  date: z.string({
    required_error: "Please select a month.",
  }),
  name: z.string().min(1, "Name is required."),
  budget: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Budget must be a valid number.",
  }),
  type: z.enum(["deduction", "income"], {
    required_error: "Please select a type.",
  }),
})

export interface CategoryFormProps {
  category?: Category,
  onSubmitted?: () => void
}

export default function BudgetCategoryForm({
  category = {},
  onSubmitted = () => { }
}: CategoryFormProps) {
  const { upsertRecord } = useCategories({ date: category.date })
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: category.date ?? '',
      name: category.name ?? '',
      budget: category.budget?.toString() ?? '',
      type: category.type ?? 'deduction'
    },
  })

  const currentDate = YYYYMMToDate(useParams().date as string)


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    await upsertRecord({
      ...category,
      ...values,
      budget: +values.budget
    })
    setIsLoading(false)
    onSubmitted()
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <div>
                <FormControl>
                  <MonthPicker
                    value={field.value ? YYYYMMToDate(field.value) : currentDate}
                    onValueChange={(date) => form.setValue("date", dateToYYYYMM(date))}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter budget amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="deduction">Deduction</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-8 ">
          <Button variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>

      </form>
    </Form>

  )
}
