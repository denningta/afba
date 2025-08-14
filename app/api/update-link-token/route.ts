// app/api/plaid/link-token/update/route.ts
import plaidClient from "@/app/lib/plaid";
import { CountryCode } from "plaid";
import { listUser } from "@/app/queries/users";
import { access } from "fs";

export async function POST(req: Request) {
  try {

    const res = await listUser({ userId: 'root-user' })
    if (!res) return
    const client_user_id = res.userId
    const access_token = res.items[0].plaidAccessToken

    console.log(client_user_id)
    console.log(access_token)

    if (!client_user_id || !access_token) {
      return Response.json({ error: "Missing client_user_id or access_token" }, { status: 400 });
    }


    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id,
      },
      client_name: "AFBA",
      language: "en",
      country_codes: [CountryCode.Us],
      access_token, // 👈 this enables update mode
    });

    return Response.json({ link_token: response.data.link_token });
  } catch (err: any) {
    console.error("Link token (update mode) error:", err);
    return Response.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}

