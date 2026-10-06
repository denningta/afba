import { getSyncStatus } from "@/app/lib/syncTransactions"

// When transactions last synced and which accounts failed, if any.
export async function GET() {
  return Response.json(await getSyncStatus())
}
