import type { Metadata } from "next"
import AccountSettings from "@/app/components/settings/AccountSettings"

export const metadata: Metadata = { title: "Account settings" }

export default function AccountSettingsPage() {
  return <AccountSettings />
}
