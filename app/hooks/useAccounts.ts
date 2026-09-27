import useSWR, { useSWRConfig } from "swr"
import axios from "axios"
import { toast } from "sonner"
import fetcher from "@/app/lib/fetcher"
import { Account } from "@/app/interfaces/account"

const ACCOUNTS_KEY = '/api/accounts'

// Every SWR key whose response depends on which accounts count toward the budget.
const isBudgetKey = (key: unknown) =>
  typeof key === 'string' && (key.startsWith('/api/categories') || key.startsWith('/api/budget'))

export default function useAccounts() {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<Account[], Error>(ACCOUNTS_KEY, fetcher)

  const setIncludeInBudget = async (account_id: string, includeInBudget: boolean) => {
    try {
      await mutate(
        async (current) => {
          await axios.patch(ACCOUNTS_KEY, { account_id, includeInBudget })
          return current?.map((a) => a.account_id === account_id ? { ...a, includeInBudget } : a)
        },
        {
          optimisticData: (current) =>
            current?.map((a) => a.account_id === account_id ? { ...a, includeInBudget } : a) ?? [],
          rollbackOnError: true,
          revalidate: false
        }
      )
      await globalMutate(isBudgetKey)
    } catch {
      toast.error('Failed to update budget accounts, please try again.')
    }
  }

  return { data, error, isLoading, setIncludeInBudget }
}
