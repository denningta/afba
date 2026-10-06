import { SyncError, syncAccount, syncAllAccounts } from "@/app/lib/syncTransactions"

export interface TransactionsSyncParams {
  account_id?: string
  // true syncs every linked account and records the outcome for the
  // "Synced 2h ago" line, like the background sync does.
  all?: boolean
}

export async function POST(request: Request) {
  const { account_id, all } = await request.json() as TransactionsSyncParams

  if (all) return Response.json(await syncAllAccounts())
  if (!account_id) return Response.json({ message: 'account_id is missing and is a required parameter' }, { status: 400 })

  try {
    return Response.json(await syncAccount(account_id))
  } catch (error: any) {
    const status = error instanceof SyncError ? error.status : 500
    const message = error?.message ?? 'Transaction sync failed'
    console.error('Transaction sync failed:', message)
    return Response.json({ message }, { status })
  }
}
