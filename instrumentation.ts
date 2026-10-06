// Runs once when the Next.js server starts.
export async function register() {
  // The scheduler needs Node (MongoDB, timers), not the edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSyncScheduler } = await import('./app/lib/syncScheduler')
    startSyncScheduler()
  }
}
