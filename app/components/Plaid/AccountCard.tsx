import useSyncTransactions from "@/app/hooks/useSyncTransactions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RiMoreFill } from "@remixicon/react"
import { Loader2Icon } from "lucide-react"
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

  return (

    <Card >
      <CardHeader>
        <CardTitle>{account.name}</CardTitle>
        <CardDescription>{account.official_name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="text-muted-foreground text-sm">Balance</div>
            <div>Current: ${account.balances.current}</div>
            <div>Available: ${account.balances.available}</div>
          </div>
          <IncludeInBudgetSwitch account_id={account.account_id} />
          <div className="flex space-x-6">
            <Button
              onClick={() => syncTransactions(account)}
              className="w-36"
            >
              {loading ?
                <span className="flex items-center space-x-2">
                  <Loader2Icon className="animate-spin" />
                  <div>Syncing...</div>
                </span>
                : 'Sync Transactions'
              }
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost"><RiMoreFill /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem>Sync</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setRemoveOpen(true)}>Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <RemoveItemDialog
              open={removeOpen}
              onOpenChange={setRemoveOpen}
              item_id={item_id}
              institutionName={institutionName}
              accounts={itemAccounts}
              onRemoved={onRemoved}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AccountCard
