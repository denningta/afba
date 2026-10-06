import { syncAllAccounts } from "./syncTransactions"

const HOUR = 60 * 60 * 1000
// Gives the server a moment to finish starting before the first sync.
const STARTUP_DELAY = 60 * 1000

// AFBA_SYNC_INTERVAL_HOURS sets how often; 0 turns it off. Off by default in
// development, where the database is often a copy of production's and
// syncing would pull production bank data into it.
function intervalMs(): number | null {
  const raw = process.env.AFBA_SYNC_INTERVAL_HOURS
  const hours = raw === undefined || raw === ''
    ? (process.env.NODE_ENV === 'production' ? 6 : 0)
    : Number(raw)
  if (!Number.isFinite(hours) || hours <= 0) return null
  return hours * HOUR
}

async function runScheduledSync() {
  try {
    const { accounts, added, modified, removed, failures } = await syncAllAccounts()
    console.log(`Scheduled sync: ${accounts} accounts, ${added} added, ${modified} modified, ${removed} removed`
      + (failures.length ? `, failed: ${failures.map(f => `${f.accountName} (${f.message})`).join(', ')}` : ''))
  } catch (error: any) {
    console.error('Scheduled sync failed:', error?.message ?? error)
  }
}

// Keeps bank transactions fresh without anyone clicking Sync. Started once
// per server process from instrumentation.ts.
export function startSyncScheduler() {
  // Dev hot reloads re-run instrumentation; keep a single timer.
  const state = globalThis as typeof globalThis & { __afbaSyncScheduler?: boolean }
  if (state.__afbaSyncScheduler) return
  const every = intervalMs()
  if (!every) return
  state.__afbaSyncScheduler = true

  console.log(`Background sync every ${every / HOUR} hours`)
  setTimeout(() => {
    runScheduledSync()
    setInterval(runScheduledSync, every)
  }, Math.min(STARTUP_DELAY, every))
}
