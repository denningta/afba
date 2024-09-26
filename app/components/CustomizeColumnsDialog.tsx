import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table } from "@tanstack/react-table"
import { Settings } from "lucide-react"

export interface CustomizeColumnsDialogProps<T> {
  table: Table<T>
}
const CustomizeColumnsDialog = <T,>({ table }: CustomizeColumnsDialogProps<T>) => {

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Table Settings</DialogTitle>
          <DialogDescription>
            Choose the colums to make visible
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="toggleAll"
            {...{
              checked: table.getIsAllColumnsVisible(),
              onChange: table.getToggleAllColumnsVisibilityHandler(),
            }}
          />
          <label
            htmlFor="toggleAll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Toggle All
          </label>
        </div>
        {table.getAllLeafColumns().map(column => {
          return (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                {...{
                  checked: column.getIsVisible(),
                  onChange: column.getToggleVisibilityHandler(),
                }}
              />
              <label
                htmlFor={column.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.id}
              </label>
            </div>
          )
        })}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

}

export default CustomizeColumnsDialog
