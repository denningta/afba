'use client'

import useAccounts from "@/app/hooks/useAccounts"
import { Account, MANUAL_ACCOUNT_ID } from "@/app/interfaces/account"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { WalletIcon } from "lucide-react"
import { useMemo } from "react"

const accountLabel = (account: Account) =>
  account.mask ? `${account.name} ••${account.mask}` : account.name

/**
 * Chooses which accounts count toward budget totals. Changes are saved to the
 * account itself, so they apply everywhere the budget is shown.
 */
const BudgetAccountsPicker = () => {
  const { data, setIncludeInBudget } = useAccounts()

  // listAccounts already sorts by institution with the manual account last.
  const groups = useMemo(() => {
    const byGroup = new Map<string, Account[]>()
    data?.forEach((account) => {
      const group = account.account_id === MANUAL_ACCOUNT_ID
        ? 'Other'
        : account.institutionName ?? 'Other'
      byGroup.set(group, [...byGroup.get(group) ?? [], account])
    })
    return Array.from(byGroup)
  }, [data])

  const includedCount = data?.filter((a) => a.includeInBudget).length ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={!data}>
          <WalletIcon />
          Accounts: {data ? `${includedCount} of ${data.length}` : '…'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div className="text-sm text-muted-foreground">
          Only transactions from checked accounts count toward the budget.
        </div>
        {groups.map(([group, accounts]) => (
          <div key={group} className="space-y-2">
            <div className="text-xs uppercase text-muted-foreground">{group}</div>
            {accounts.map((account) => {
              const id = `budget-account-${account.account_id}`
              return (
                <div key={account.account_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    checked={account.includeInBudget}
                    onCheckedChange={(checked) => setIncludeInBudget(account.account_id, checked === true)}
                  />
                  <Label htmlFor={id} className="font-normal">{accountLabel(account)}</Label>
                </div>
              )
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export default BudgetAccountsPicker
