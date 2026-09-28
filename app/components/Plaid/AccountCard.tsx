import useSyncTransactions from "@/app/hooks/useSyncTransactions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisIcon, RefreshCwIcon } from "lucide-react"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { AccountBase } from "plaid"
import IncludeInBudgetSwitch from "./IncludeInBudgetSwitch"
import RemoveItemDialog from "./RemoveItemDialog"
import { useState } from "react"

export interface AccountCardProps {
  account: AccountBase
  item_id: string
  institutionName?: string | null
  // Every account under the same item - removing one removes them all.
  itemAccounts: AccountBase[]
  onRemoved: () => void
}

const AccountCard = ({ account, item_id, institutionName, itemAccounts, onRemoved }: AccountCardProps) => {
  const {
    syncTransactions,
    loading,
  } = useSyncTransactions()
  const [removeOpen, setRemoveOpen] = useState(false)

  const { current, available } = account.balances

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium" title={account.name}>
            {account.name}
            {account.mask && <span className="ml-1.5 font-normal text-muted-foreground">••{account.mask}</span>}
          </div>
          <div className="truncate text-xs capitalize text-muted-foreground">
            {account.official_name ?? account.subtype ?? account.type}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={loading ? "Syncing transactions" : "Sync transactions"}
            title="Sync transactions"
            disabled={loading}
            onClick={() => syncTransactions(account)}
          >
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Account actions">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem onSelect={() => syncTransactions(account)}>Sync transactions</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setRemoveOpen(true)}>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <div className="text-2xl font-semibold tracking-tight">
          {current != null ? toCurrency(current) : '—'}
        </div>
        {available != null && available !== current &&
          <div className="text-xs text-muted-foreground">{toCurrency(available)} available</div>
        }
      </div>

      <IncludeInBudgetSwitch account_id={account.account_id} />

      <RemoveItemDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        item_id={item_id}
        institutionName={institutionName}
        accounts={itemAccounts}
        onRemoved={onRemoved}
      />
    </div>
  )
}

export default AccountCard
