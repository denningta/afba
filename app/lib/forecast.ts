// Pure forecast math: no I/O, so the server can build events and the client
// can rebuild the balance line instantly when sources are toggled.
import { addDays, addMonths, addYears, differenceInCalendarDays, endOfMonth, format, getDaysInMonth, parseISO, setDate } from "date-fns"
import type { ForecastEvent, ForecastFrequency } from "../interfaces/forecast"

const ISO = 'yyyy-MM-dd'
const toISO = (date: Date) => format(date, ISO)
// Safety valve for malformed input; 90 days of weekly events is ~13.
const MAX_OCCURRENCES = 500

// The k-th occurrence after `start` (k = 0 is `start`). Monthly and yearly
// steps count from the original date, so the 31st stays the 31st (or the
// month's last day) instead of drifting to the 28th after February.
function occurrence(start: Date, frequency: ForecastFrequency, k: number): Date {
  switch (frequency) {
    case 'WEEKLY': return addDays(start, 7 * k)
    case 'BIWEEKLY': return addDays(start, 14 * k)
    case 'MONTHLY': return addMonths(start, k)
    case 'ANNUALLY': return addYears(start, k)
    case 'SEMI_MONTHLY': {
      // Twice a month: the start's day, and 15 days later (capped at month end).
      const month = addMonths(start, Math.floor(k / 2))
      if (k % 2 === 0) return month
      const day = Math.min(start.getDate() + 15, getDaysInMonth(month))
      return setDate(month, day)
    }
    default: return start
  }
}

// Every date a transaction repeats on within [from, to] (inclusive, YYYY-MM-DD).
// One-off and UNKNOWN-frequency items yield just `start`, if it's in range.
export function expandOccurrences(
  start: string,
  frequency: ForecastFrequency,
  from: string,
  to: string,
  endDate?: string | null,
): string[] {
  const startDate = parseISO(start)
  const fromDate = parseISO(from)
  const toDate = parseISO(endDate && endDate < to ? endDate : to)
  if (isNaN(startDate.getTime())) return []

  if (frequency === 'once' || frequency === 'UNKNOWN') {
    return startDate >= fromDate && startDate <= toDate ? [start] : []
  }

  const dates: string[] = []
  for (let k = 0; k < MAX_OCCURRENCES; k++) {
    const date = occurrence(startDate, frequency, k)
    if (date > toDate) break
    // Plaid's predicted date can lag behind today; skip past occurrences.
    if (date >= fromDate) dates.push(toISO(date))
  }
  return dates
}

// How long past its predicted date a recurring item still counts as "late"
// (arriving any day) rather than missed.
export const LATE_GRACE_DAYS = 7

// A recurring item is late when its predicted date has passed, Plaid hasn't
// seen that occurrence yet (its last transaction predates the prediction), and
// it's overdue by no more than LATE_GRACE_DAYS. Banks post deposits and bills
// a day or two off schedule, and a pending one isn't visible through Plaid, so
// the forecast should still expect it now instead of skipping to next month.
export function isLate(predicted: string, lastSeen: string | null | undefined, from: string) {
  if (predicted >= from) return false
  if (lastSeen && lastSeen >= predicted) return false
  return differenceInCalendarDays(parseISO(from), parseISO(predicted)) <= LATE_GRACE_DAYS
}

// Spread each month's remaining budget evenly across its days in range, as
// one "Budgeted spending" event per day with a per-category breakdown.
export function spreadBudget(
  months: { month: string, categories: { categoryName: string, remaining: number }[] }[],
  from: string,
  to: string,
): ForecastEvent[] {
  const byDate = new Map<string, ForecastEvent>()

  for (const { month, categories } of months) {
    const monthStart = parseISO(`${month}-01`)
    const monthEnd = endOfMonth(monthStart)
    const rangeStart = parseISO(from) > monthStart ? parseISO(from) : monthStart
    const rangeEnd = parseISO(to) < monthEnd ? parseISO(to) : monthEnd
    if (rangeStart > rangeEnd) continue

    // This month's remainder covers the rest of the month, starting today.
    const daysLeft = differenceInCalendarDays(monthEnd, rangeStart) + 1

    for (let day = rangeStart; day <= rangeEnd; day = addDays(day, 1)) {
      const date = toISO(day)
      const breakdown = categories
        .filter(c => c.remaining > 0)
        .map(c => ({ categoryName: c.categoryName, amount: round2(c.remaining / daysLeft) }))
      const amount = round2(breakdown.reduce((sum, c) => sum + c.amount, 0))
      if (amount <= 0) continue
      byDate.set(date, {
        date,
        amount,
        name: 'Budgeted spending',
        source: 'budget',
        confidence: 'low',
        breakdown,
      })
    }
  }

  return [...byDate.values()]
}

export interface ForecastPoint {
  date: string
  balance: number
  net: number
  events: ForecastEvent[]
}

export interface Forecast {
  points: ForecastPoint[]
  low: { date: string, balance: number }
  end: number
  totalIn: number
  totalOut: number
}

// Daily projected balance from `from` for `days` days. Day 0 is today: the
// start balance less anything expected today that hasn't posted yet.
export function buildForecast({ startBalance, events, from, days }: {
  startBalance: number
  events: ForecastEvent[]
  from: string
  days: number
}): Forecast {
  const byDate = new Map<string, ForecastEvent[]>()
  for (const event of events) {
    byDate.set(event.date, [...(byDate.get(event.date) ?? []), event])
  }

  const points: ForecastPoint[] = []
  let balance = startBalance
  let totalIn = 0
  let totalOut = 0
  const start = parseISO(from)

  for (let i = 0; i <= days; i++) {
    const date = toISO(addDays(start, i))
    const dayEvents = (byDate.get(date) ?? []).sort((a, b) => a.amount - b.amount)
    const net = dayEvents.reduce((sum, e) => sum + e.amount, 0)
    for (const e of dayEvents) {
      if (e.amount < 0) totalIn += -e.amount
      else totalOut += e.amount
    }
    balance = round2(balance - net)
    points.push({ date, balance, net: round2(net), events: dayEvents })
  }

  // The lowest projected day (today included, after anything due today).
  const low = points.reduce(
    (min, p) => p.balance < min.balance ? { date: p.date, balance: p.balance } : min,
    { date: points[0].date, balance: points[0].balance },
  )

  return {
    points,
    low,
    end: points[points.length - 1]?.balance ?? startBalance,
    totalIn: round2(totalIn),
    totalOut: round2(totalOut),
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
