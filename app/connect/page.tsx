import type { Metadata } from "next";
import CreatePlaidLink from "../components/Plaid/PlaidLink";

export const metadata: Metadata = { title: "Accounts" }

export default async function ConnectPage() {
  return <CreatePlaidLink />
}
