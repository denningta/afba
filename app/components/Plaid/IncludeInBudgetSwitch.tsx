'use client'

import useAccounts from "@/app/hooks/useAccounts"
import useCurrentUser from "@/app/hooks/useCurrentUser"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface IncludeInBudgetSwitchProps {
  account_id: string
}

const IncludeInBudgetSwitch = ({ account_id }: IncludeInBudgetSwitchProps) => {
  const { data, setIncludeInBudget } = useAccounts()
  // Changes what the whole household's budget counts, so admins only.
  const { isAdmin } = useCurrentUser()
  const account = data?.find((a) => a.account_id === account_id)
  const id = `include-in-budget-${account_id}`

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={id}
        checked={account?.includeInBudget ?? false}
        disabled={!account || !isAdmin}
        onCheckedChange={(checked) => setIncludeInBudget(account_id, checked)}
      />
      <Label htmlFor={id}>Include in budget</Label>
    </div>
  )
}

export default IncludeInBudgetSwitch
