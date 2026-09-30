import { ObjectId } from "mongodb"

// Plaid's recurring frequencies plus 'once' for one-off scheduled items.
export type ForecastFrequency = 'once' | 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'ANNUALLY' | 'UNKNOWN'

export type ForecastSource = 'recurring' | 'budget' | 'scheduled'

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
  // Past its predicted date but not seen yet: placed on today.
  late?: boolean
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
  nextDate?: string | null
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
}
