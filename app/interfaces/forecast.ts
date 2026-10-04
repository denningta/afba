import { ObjectId } from "mongodb"

// Plaid's recurring frequencies plus 'once' for one-off scheduled items.
export type ForecastFrequency = 'once' | 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'ANNUALLY' | 'UNKNOWN'

// 'budget' is the only estimated source; the rest are committed (known items).
export type ForecastSource = 'recurring' | 'budget' | 'scheduled' | 'paycheck'

export const COMMITTED_SOURCES: ForecastSource[] = ['recurring', 'scheduled', 'paycheck']

// One expected transaction on one day. Amounts use Plaid's sign convention:
// positive is money out, negative is money in.
export interface ForecastEvent {
  date: string // YYYY-MM-DD
  amount: number
  name: string
  source: ForecastSource
  confidence: 'high' | 'low'
  streamId?: string
  scheduledId?: string
  categoryName?: string
  logoUrl?: string | null
  // Past its predicted date but not seen yet: placed on today and counted.
  late?: boolean
  // When it was expected, for late items (date is then today).
  expectedDate?: string
  payScheduleId?: string
  // Income that marks a payday: the end of the "safe to spend" window.
  paycheck?: boolean
  // Budget events: how the day's amount splits across categories.
  breakdown?: { categoryName: string, amount: number }[]
}

// A Plaid recurring stream as the forecast sees it (after overrides).
export interface ForecastStream {
  streamId: string
  name: string
  amount: number
  frequency: ForecastFrequency
  nextDate: string
  confidence: 'high' | 'low'
  categoryName?: string
  logoUrl?: string | null
  hidden: boolean
  overridden: boolean
  // Date of the stream's most recent transaction Plaid has seen.
  lastDate?: string | null
  // How the forecast amount is chosen; 'average' of the last 3 by default.
  amountMode: BillAmountMode
  // The stream's latest posted amounts, newest first (up to 3).
  recentAmounts: number[]
  // A pay schedule stands in for this stream, so it isn't forecast itself.
  replacedByPaySchedule?: string
}

export type BillAmountMode = 'average' | 'last' | 'fixed'

// A recurring item's occurrence that has already posted this cycle, found
// among synced transactions, so it isn't forecast again.
export interface PaidOccurrence {
  key: string // streamId / payScheduleId
  name: string
  expectedDate: string
  postedDate: string
  amount: number
  logoUrl?: string | null
  categoryName?: string
  source: ForecastSource
}

// When paychecks arrive, set by the user so income doesn't follow Plaid's
// guesses. Amount is what's received (positive).
export interface PaySchedule {
  _id?: ObjectId | string
  account_id: string
  name: string
  amount: number
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY'
  // A payday on the schedule (the next one), YYYY-MM-DD. For SEMI_MONTHLY
  // the days of the month come from semiMonthlyDays instead.
  anchorDate: string
  semiMonthlyDays?: [number, number] | null
  // Paydays on a weekend move to the Friday before, the Monday after, or stay.
  weekendRule: 'before' | 'after' | 'none'
  // The Plaid income stream this schedule replaces.
  replacesStreamId?: string | null
}

export interface ForecastSettings {
  account_id: string
  // Never counted as spendable.
  cushion: number
}

export interface SafeToSpend {
  amount: number
  perDay: number
  // First payday after today, or null when none is known (window = rest of month).
  payday: string | null
  paydayName?: string
  windowEnd: string // last day counted, YYYY-MM-DD
  days: number
  startBalance: number
  cushion: number
  outflows: ForecastEvent[]
  inflows: ForecastEvent[]
}

export interface ForecastChange {
  kind: 'balance' | 'safeToSpend' | 'paid' | 'late' | 'new' | 'removed' | 'moved' | 'amount'
  text: string
  amount?: number
}

// A user-entered upcoming transaction, one-off or repeating.
export interface ScheduledTransaction {
  _id?: ObjectId | string
  account_id: string
  name: string
  amount: number
  date: string // YYYY-MM-DD, first occurrence
  frequency: Exclude<ForecastFrequency, 'SEMI_MONTHLY' | 'UNKNOWN'>
  endDate?: string | null
  note?: string | null
}

// User adjustments to a Plaid stream, applied before it's projected forward.
export interface StreamOverride {
  _id?: ObjectId | string
  stream_id: string
  hidden?: boolean
  amount?: number | null
  amountMode?: BillAmountMode | null
  nextDate?: string | null
}

// How one month's budget becomes "Budgeted spending" in the forecast, per
// expense category: budget − spent − recurring bills already forecast in the
// category (never below 0), spread evenly over the month's remaining days.
export interface BudgetPlanCategory {
  categoryName: string
  budget: number
  spent: number
  // Recurring bills in this category this month, forecast on their own dates.
  bills: { name: string, date: string, amount: number, late?: boolean }[]
  billsTotal: number
  remaining: number
}

export interface BudgetPlanMonth {
  month: string // YYYY-MM
  // No budget saved for this month yet, so the current month's was reused (with nothing spent).
  assumedFrom?: string
  // Days the remainder is spread over: from today (or the 1st) to month end.
  daysLeft: number
  categories: BudgetPlanCategory[]
  // Income and transfer categories, which budgeted spending doesn't draw on.
  excluded: { categoryName: string, type: string, budget: number }[]
  // Spending this month with no category yet. It's already out of the balance,
  // so it comes off what's left to spend instead of being expected again.
  uncategorizedSpent: number
}

export interface ForecastResponse {
  account: {
    account_id: string
    name: string
    mask?: string | null
    type: string
    subtype?: string | null
  }
  startBalance: number
  balanceSource: 'available' | 'current'
  // When Plaid last refreshed this account from the bank (ISO timestamp).
  balanceAsOf?: string | null
  from: string // YYYY-MM-DD (today)
  days: number
  streams: ForecastStream[]
  scheduled: ScheduledTransaction[]
  events: ForecastEvent[]
  // Absent when this account doesn't carry the budget; see budgetSkippedReason.
  budgetPlan?: BudgetPlanMonth[]
  budgetSkippedReason?: string
  paid: PaidOccurrence[]
  paySchedules: PaySchedule[]
  settings: ForecastSettings
  safeToSpend: SafeToSpend
  // What's different since the last snapshot taken on an earlier day.
  changesSince?: string | null
  changes: ForecastChange[]
}
