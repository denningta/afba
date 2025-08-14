import plaidClient from "@/app/lib/plaid"
import { TransactionsRecurringGetRequest } from "plaid"

export interface RecurringTransactionsParams {
  access_token?: string
  account_ids?: string[]
}

export async function POST(request: Request) {
  try {
    const {
      access_token,
      account_ids
    } = await request.json() as RecurringTransactionsParams

    if (!access_token) return Response.json({ error: 'access_token not defined', status: 500 })

    const plaidReq: TransactionsRecurringGetRequest = {
      access_token: access_token
    }

    if (account_ids) plaidReq.account_ids = account_ids

    const response = await plaidClient.transactionsRecurringGet(plaidReq)

    return Response.json(response.data)


  } catch (err: any) {

    return Response.json({ error: `Something went wrong: ${err}`, status: 500 })

  }
}
