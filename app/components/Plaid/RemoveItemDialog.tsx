'use client'

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { Loader2Icon } from "lucide-react"
import { AccountBase } from "plaid"
import { useState } from "react"
import { toast } from "sonner"
import { useSWRConfig } from "swr"

export interface RemoveItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item_id: string
  institutionName?: string | null
  accounts: AccountBase[]
  onRemoved: () => void
}

/**
 * Plaid can only disconnect a whole item (one bank login), so this confirms
 * every account that goes with it.
 */
const RemoveItemDialog = ({
  open,
  onOpenChange,
  item_id,
  institutionName,
  accounts,
  onRemoved
}: RemoveItemDialogProps) => {
  const { mutate } = useSWRConfig()
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [removing, setRemoving] = useState(false)
  const name = institutionName ?? 'this institution'

  const handleRemove = async () => {
    setRemoving(true)
    try {
      const res = await axios.delete('/api/items', { data: { item_id, deleteTransactions } })
      const deleted = res.data.deletedTransactions
      toast.success(`Removed ${name}${deleted ? ` and deleted ${deleted} transactions` : ''}.`)

      // Account lists, budget totals and transaction labels all depend on this item.
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/'))
      onOpenChange(false)
      onRemoved()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Failed to remove ${name}.`)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name}?</DialogTitle>
          <DialogDescription>
            This disconnects the {name} login from Plaid. Every account under it will be removed:
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc pl-6 text-sm">
          {accounts.map((account) => (
            <li key={account.account_id}>
              {account.name}{account.mask ? ` ••${account.mask}` : ''}
            </li>
          ))}
        </ul>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`delete-transactions-${item_id}`}
            checked={deleteTransactions}
            onCheckedChange={(checked) => setDeleteTransactions(checked === true)}
          />
          <Label htmlFor={`delete-transactions-${item_id}`} className="font-normal">
            Also delete transactions synced from these accounts
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={removing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removing}>
            {removing && <Loader2Icon className="animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RemoveItemDialog
