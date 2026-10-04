// Pure forecast math: no I/O, so the server can build events and the client
// can rebuild the balance line instantly when sources are toggled.
import { addDays, addMonths, addYears, differenceInCalendarDays, endOfMonth, format, getDay, getDaysInMonth, parseISO, setDate } from "date-fns"
import type { ForecastChange, ForecastEvent, ForecastFrequency, PaySchedule, SafeToSpend } from "../interfaces/forecast"

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

// --- Matching posted transactions to expected occurrences --------------------

// A synced transaction, reduced to what matching needs. Date is YYYY-MM-DD.
export interface PostedTransaction {
  transaction_id?: string
  date: string
  amount: number
  name: string
}

// How far from the expected date a posted transaction still counts as that
// occurrence: bills often post a few days early, deposits a day or two late.
export const MATCH_DAYS_EARLY = 5
export const MATCH_DAYS_LATE = 7
// How far a matched amount may differ from the expected one (variable bills).
export const MATCH_AMOUNT_TOLERANCE = 0.25

export const normalizeName = (name: string | null | undefined) =>
  (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// The posted transaction that is this occurrence, if it has already happened:
// one of the stream's own transactions, or one with the same name, within the
// date window and amount tolerance (any amount for the stream's own ids).
// `used` stops one transaction from paying two occurrences.
export function matchOccurrence({ expectedDate, expectedAmount, names, transactionIds, today, posted, used }: {
  expectedDate: string
  expectedAmount: number
  names: string[]
  transactionIds?: Set<string>
  today: string
  posted: PostedTransaction[]
  used?: Set<string>
}): PostedTransaction | undefined {
  const earliest = toISO(addDays(parseISO(expectedDate), -MATCH_DAYS_EARLY))
  const latestByRule = toISO(addDays(parseISO(expectedDate), MATCH_DAYS_LATE))
  const latest = latestByRule < today ? latestByRule : today
  const wanted = names.map(normalizeName).filter(Boolean)

  const candidates = posted.filter(t => {
    if (t.date < earliest || t.date > latest) return false
    if (t.transaction_id && used?.has(t.transaction_id)) return false
    if (Math.sign(t.amount) !== Math.sign(expectedAmount)) return false
    if (t.transaction_id && transactionIds?.has(t.transaction_id)) return true
    const name = normalizeName(t.name)
    const sameName = !!name && wanted.some(w => name === w || name.includes(w) || w.includes(name))
    const closeAmount = Math.abs(t.amount - expectedAmount) <= Math.abs(expectedAmount) * MATCH_AMOUNT_TOLERANCE
    return sameName && closeAmount
  })

  const distance = (t: PostedTransaction) => Math.abs(differenceInCalendarDays(parseISO(t.date), parseISO(expectedDate)))
  return candidates.sort((a, b) => distance(a) - distance(b))[0]
}

// --- Pay schedules ------------------------------------------------------------

// Moves a weekend date to the Friday before or the Monday after.
export function shiftForWeekend(date: string, rule: PaySchedule['weekendRule']) {
  if (rule === 'none') return date
  const day = getDay(parseISO(date)) // 0 Sunday, 6 Saturday
  if (day !== 0 && day !== 6) return date
  const shift = rule === 'before' ? (day === 6 ? -1 : -2) : (day === 6 ? 2 : 1)
  return toISO(addDays(parseISO(date), shift))
}

// Paydays in [from, to], after the weekend rule. Starts a cycle early so a
// payday pulled back from a weekend into the range isn't missed.
export function expandPaySchedule(schedule: PaySchedule, from: string, to: string): string[] {
  const lookbackFrom = toISO(addDays(parseISO(from), -3))
  let dates: string[]
  if (schedule.frequency === 'SEMI_MONTHLY' || schedule.frequency === 'MONTHLY') {
    // Fixed days of the month (capped at the month's last day), so the 31st
    // stays the 31st instead of drifting after a short month.
    const days = schedule.frequency === 'MONTHLY'
      ? [parseISO(schedule.anchorDate).getDate()]
      : schedule.semiMonthlyDays ?? [1, 15]
    dates = []
    for (let month = parseISO(`${lookbackFrom.slice(0, 7)}-01`); month <= parseISO(to); month = addMonths(month, 1)) {
      for (const day of days) {
        dates.push(toISO(setDate(month, Math.min(day, getDaysInMonth(month)))))
      }
    }
  } else {
    // Walk back from the anchor so paydays before it are included too.
    const step = schedule.frequency === 'WEEKLY' ? 7 : 14
    let start = parseISO(schedule.anchorDate)
    while (toISO(start) > lookbackFrom) start = addDays(start, -step)
    dates = expandOccurrences(toISO(start), schedule.frequency, lookbackFrom, toISO(addDays(parseISO(to), 3)))
  }
  return [...new Set(dates.map(d => shiftForWeekend(d, schedule.weekendRule)))]
    .filter(d => d >= from && d <= to)
    .sort()
}

// --- Safe to spend ------------------------------------------------------------

// What can be spent before the next payday without dipping below the cushion:
//   balance − known outflows before payday + known inflows before payday − cushion
// Paychecks mark the window and aren't counted. With no payday known, the
// window is the rest of the month.
export function safeToSpend({ startBalance, events, from, cushion }: {
  startBalance: number
  events: ForecastEvent[] // committed only
  from: string
  cushion: number
}): SafeToSpend {
  const nextPaycheck = events
    .filter(e => e.paycheck && e.date > from)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const windowEnd = nextPaycheck
    ? toISO(addDays(parseISO(nextPaycheck.date), -1))
    : toISO(endOfMonth(parseISO(from)))

  const inWindow = events.filter(e => !e.paycheck && e.date >= from && e.date <= windowEnd)
  const outflows = inWindow.filter(e => e.amount > 0)
  const inflows = inWindow.filter(e => e.amount < 0)
  const out = outflows.reduce((sum, e) => sum + e.amount, 0)
  const income = inflows.reduce((sum, e) => sum - e.amount, 0)
  const amount = round2(startBalance - out + income - cushion)
  const days = differenceInCalendarDays(parseISO(windowEnd), parseISO(from)) + 1

  return {
    amount,
    perDay: round2(days > 0 ? amount / days : amount),
    payday: nextPaycheck?.date ?? null,
    paydayName: nextPaycheck?.name,
    windowEnd,
    days,
    startBalance,
    cushion,
    outflows,
    inflows,
  }
}

// --- What changed since the last snapshot -------------------------------------

export interface SnapshotItem {
  key: string // stream/schedule/item id; one entry per item (its next occurrence)
  name: string
  date: string
  amount: number
  late?: boolean
}

export interface ForecastSnapshot {
  date: string
  startBalance: number
  safeToSpend: number
  items: SnapshotItem[]
  // "key@postedDate" for each paid occurrence, so a later cycle reads as new.
  paidKeys: string[]
}

// Plain-language differences between two snapshots, most important first.
export function diffSnapshots(before: ForecastSnapshot, after: ForecastSnapshot): ForecastChange[] {
  const changes: ForecastChange[] = []
  const money = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const day = (d: string) => format(parseISO(d), 'MMM d')
  const signed = (n: number) => `${n >= 0 ? '+' : '−'}${money(n)}`

  const balanceDelta = round2(after.startBalance - before.startBalance)
  if (Math.abs(balanceDelta) >= 0.01) {
    changes.push({ kind: 'balance', amount: balanceDelta, text: `Balance ${balanceDelta >= 0 ? 'up' : 'down'} ${money(balanceDelta)} (${money(before.startBalance)} → ${money(after.startBalance)})` })
  }
  const safeDelta = round2(after.safeToSpend - before.safeToSpend)
  if (Math.abs(safeDelta) >= 0.01) {
    changes.push({ kind: 'safeToSpend', amount: safeDelta, text: `Safe to spend ${signed(safeDelta)}` })
  }

  const beforeByKey = new Map(before.items.map(i => [i.key, i]))
  const afterByKey = new Map(after.items.map(i => [i.key, i]))
  const paidNow = new Set(after.paidKeys.filter(k => !before.paidKeys.includes(k)).map(k => k.split('@')[0]))

  for (const [key, was] of beforeByKey) {
    const now = afterByKey.get(key)
    if (paidNow.has(key)) {
      changes.push({ kind: 'paid', amount: was.amount, text: `${was.name} ${was.amount < 0 ? 'arrived' : 'posted'} (${money(was.amount)})` })
      continue
    }
    if (!now) {
      // Its occurrence simply passed into the window's past without posting.
      if (was.date < after.date) continue
      changes.push({ kind: 'removed', amount: was.amount, text: `${was.name} no longer expected (was ${money(was.amount)} on ${day(was.date)})` })
      continue
    }
    if (now.late && !was.late) {
      changes.push({ kind: 'late', amount: now.amount, text: `${now.name} is late (expected ${day(was.date)})` })
    } else if (now.date !== was.date && !now.late) {
      changes.push({ kind: 'moved', text: `${now.name} moved ${day(was.date)} → ${day(now.date)}` })
    }
    if (Math.abs(now.amount - was.amount) >= 1) {
      changes.push({ kind: 'amount', amount: now.amount - was.amount, text: `${now.name} now ${money(now.amount)} (was ${money(was.amount)})` })
    }
  }
  for (const [key, now] of afterByKey) {
    if (!beforeByKey.has(key) && !paidNow.has(key)) {
      changes.push({ kind: 'new', amount: now.amount, text: `New: ${now.name}, ${money(now.amount)} on ${day(now.date)}` })
    }
  }
  return changes
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
