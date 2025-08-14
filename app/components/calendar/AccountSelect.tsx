import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountBase, AccountsGetResponse } from "plaid";

export interface AccountSelectProps {
  value?: string | null
  accounts: AccountBase[]
  defaultValue?: string
  onValueChange: (account_id: string) => void

}

export default function AccountSelect({
  value,
  accounts,
  defaultValue,
  onValueChange
}: AccountSelectProps) {

  return (
    <Select
      value={value || undefined}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) =>
          <SelectItem
            value={account.account_id}
            key={account.account_id}
          >
            {account.name}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )

}
