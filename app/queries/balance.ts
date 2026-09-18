import { transactions } from "@/app/lib/mongodb"
import Transaction from "../interfaces/transaction"
import { BalanceTransaction } from "../interfaces/balance"

/**
 * Transaction dates in this database are inconsistently formatted —
 * historical/cloned data uses "MM/DD/YYYY" while Plaid-synced data uses
 * ISO "YYYY-MM-DD" — so every consumer of `date` needs this normalized
 * before comparing or bucketing by day.
 */
function normalizeDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10)

  const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const [, month, day, year] = match
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return date
}

export async function listTransactionsForBalance(accountIds: string[]) {
  const res = await transactions
    .find({
      account_id: { $in: accountIds },
      pending: { $ne: true }
    })
    .toArray()

  return (res as unknown as Transaction[]).map((t) => ({
    ...t,
    date: t.date ? normalizeDate(t.date) : t.date
  }))
}

export function buildDateAxis(start: string, end: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)

  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

/**
 * Plaid only exposes a current balance, not history, so this walks backward
 * from `currentBalance` through each day's net transaction amount (positive
 * amount = debit) to reconstruct what the balance was on each prior day.
 * Dates before the earliest transaction are flat-filled with the earliest
 * reconstructed value, since there's no better data available.
 */
export function reconstructAccountSeries(
  accountTransactions: Pick<Transaction, "date" | "amount">[],
  currentBalance: number,
  dates: string[]
): number[] {
  const dailyNet = new Map<string, number>()
  for (const t of accountTransactions) {
    if (!t.date) continue
    dailyNet.set(t.date, (dailyNet.get(t.date) ?? 0) + t.amount)
  }

  const txDatesDesc = Array.from(dailyNet.keys()).sort().reverse()

  const endOfDayBalance = new Map<string, number>()
  let running = currentBalance
  for (const date of txDatesDesc) {
    endOfDayBalance.set(date, running)
    running += dailyNet.get(date)!
  }
  const balanceBeforeEarliestTransaction = running

  const txDatesAsc = [...txDatesDesc].reverse()

  let txIndex = 0
  let lastKnownBalance = balanceBeforeEarliestTransaction
  const series: number[] = []

  for (const date of dates) {
    while (txIndex < txDatesAsc.length && txDatesAsc[txIndex] <= date) {
      lastKnownBalance = endOfDayBalance.get(txDatesAsc[txIndex])!
      txIndex++
    }
    series.push(lastKnownBalance)
  }

  return series
}

export function toBalanceTransactions(
  rangeTransactions: Pick<Transaction, "_id" | "date" | "account_id" | "name" | "merchant_name" | "amount" | "pending" | "userCategory">[]
): BalanceTransaction[] {
  return rangeTransactions
    .filter((t) => t.date)
    .map((t) => ({
      _id: String(t._id),
      date: t.date!,
      account_id: t.account_id,
      name: t.name,
      merchant_name: t.merchant_name,
      amount: t.amount,
      pending: t.pending,
      categoryName: t.userCategory?.name ?? null
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
