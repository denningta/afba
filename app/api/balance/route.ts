import plaidClient from "@/app/lib/plaid"
import { listUser, User } from "@/app/queries/users"
import {
  buildDateAxis,
  listTransactionsForBalance,
  reconstructAccountSeries,
  toBalanceTransactions
} from "@/app/queries/balance"
import { AccountBalanceMeta, BalanceHistoryResponse } from "@/app/interfaces/balance"

export const dynamic = 'force-dynamic'

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const today = new Date()
    const defaultStart = new Date(today)
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 90)

    const startDate = searchParams.get('startDate') ?? formatDate(defaultStart)
    const endDate = searchParams.get('endDate') ?? formatDate(today)

    const user = await listUser({ userId: 'root-user' }) as User
    if (!user || !user.items?.length) {
      return Response.json({ message: 'No linked accounts found', status: 400 })
    }

    const accountsPerItem = await Promise.all(
      user.items.map(({ plaidAccessToken }) =>
        plaidClient.accountsGet({ access_token: plaidAccessToken })
      )
    )

    const accounts: AccountBalanceMeta[] = accountsPerItem.flatMap(({ data }) =>
      data.accounts.map((account) => ({
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
        institution_id: data.item.institution_id,
        institutionName: data.item.institution_name,
        currentBalance: account.balances.current ?? account.balances.available ?? 0
      }))
    )

    const accountIds = accounts.map((account) => account.account_id)
    const allTransactions = await listTransactionsForBalance(accountIds)

    const dates = buildDateAxis(startDate, endDate)

    const balancesByAccount: Record<string, number[]> = {}
    for (const account of accounts) {
      const accountTransactions = allTransactions.filter(
        (t) => t.account_id === account.account_id
      )
      balancesByAccount[account.account_id] = reconstructAccountSeries(
        accountTransactions,
        account.currentBalance,
        dates
      )
    }

    const transactionsInRange = allTransactions.filter(
      (t) => t.date && t.date >= startDate && t.date <= endDate
    )
    const transactionsForDisplay = toBalanceTransactions(transactionsInRange)

    const response: BalanceHistoryResponse = {
      dates,
      accounts,
      balancesByAccount,
      transactions: transactionsForDisplay
    }

    return Response.json(response)

  } catch (error: any) {
    throw new Error(error)
  }
}
