"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import useGetAccounts from "../../hooks/useGetAccounts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"
import PageHeader from "../common/PageHeader"
import AccountCard from "./AccountCard"
import UpdatePlaidLink from "./UpdatePlaidLink"
import { AccountBase } from "plaid"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import IncludeInBudgetSwitch from "./IncludeInBudgetSwitch"
import { MANUAL_ACCOUNT_ID } from "@/app/interfaces/account"


const client_user_id = 'root-user'

interface ItemError {
  item_id: string
  error: { error_code?: string, error_message?: string, display_message?: string | null }
}

// /api/accounts returns { item_id, error } in place of an item Plaid couldn't read.
const isItemError = (item: object): item is ItemError => 'error' in item && !('accounts' in item)

const CreatePlaidLink = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const { items, refresh } = useGetAccounts({ userId: client_user_id })
  const { mutate } = useSWRConfig()
  // Read through a ref so onSuccess (and the Plaid Link config) stays stable.
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  // Update mode adds/removes accounts on the existing item; re-read them into the cache.
  const afterUpdate = () => {
    refreshRef.current()
    mutate('/api/accounts')
  }

  useEffect(() => {
    createLinkToken()
  }, [])

  const createLinkToken = async () => {
    try {

      const body: { client_user_id: string, access_token?: string } = {
        client_user_id: client_user_id,
      }

      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      const data = await response.json()
      setLinkToken(data.link_token)

    } catch (err: any) {
      console.error(err)
      throw new Error(err)
    }
  }

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {

      const response = await fetch('/api/exchange-public-token', {
        method: 'POST',
        body: JSON.stringify({ client_user_id, public_token })
      })

      const data = await response.json()

      if (!response.ok) {
        // 409 = this login's accounts are already linked (see exchange-public-token).
        toast.error(data.message ?? 'Failed to link account.')
        return
      }

      toast.success('Account linked.')
      refreshRef.current()
      mutate('/api/accounts')

    } catch (err: any) {
      console.error(err)
      toast.error('Failed to link account.')
    }
  }, [mutate])

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess
  }

  const { open, ready } = usePlaidLink(config)

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Accounts"
        description="Linked institutions and which accounts count toward your budget."
        actions={
          <Button onClick={() => open()} disabled={!ready}>
            <PlusIcon />
            Link account
          </Button>
        }
      />

      {items && Array.isArray(items) && items.map((item, i) => (
        isItemError(item)
          ? (
            <Card key={`item-${i}`} className="ring-destructive/40">
              <CardHeader>
                <CardTitle>Connection needs attention</CardTitle>
                <CardDescription className="text-destructive">
                  {item.error.display_message ?? item.error.error_message ?? 'This connection needs attention.'}
                </CardDescription>
                {item.error.error_code === 'ITEM_LOGIN_REQUIRED' &&
                  <CardAction>
                    <UpdatePlaidLink item_id={item.item_id} label="Log in again" onSuccess={afterUpdate} />
                  </CardAction>
                }
              </CardHeader>
            </Card>
          )
          : (
            <Card key={`item-${i}`}>
              <CardHeader>
                <CardTitle className="text-base">{item.item?.institution_name ?? 'Institution'}</CardTitle>
                <CardDescription>
                  {item.accounts?.length ?? 0} account{item.accounts?.length === 1 ? '' : 's'}
                </CardDescription>
                <CardAction>
                  <UpdatePlaidLink
                    item_id={item.item.item_id}
                    accountSelection
                    label="Manage accounts"
                    onSuccess={afterUpdate}
                  />
                </CardAction>
              </CardHeader>
              <CardContent>
                {item?.accounts?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {item.accounts.map((account: AccountBase) => (
                      <AccountCard
                        key={account.account_id}
                        account={account}
                        item_id={item.item.item_id}
                        institutionName={item.item.institution_name}
                        itemAccounts={item.accounts}
                        onRemoved={refresh}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No accounts found.</p>
                )}
              </CardContent>
            </Card>
          )
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual / Imported</CardTitle>
          <CardDescription>Transactions added by hand or uploaded from CSV, with no linked account.</CardDescription>
        </CardHeader>
        <CardContent>
          <IncludeInBudgetSwitch account_id={MANUAL_ACCOUNT_ID} />
        </CardContent>
      </Card>
    </div>
  )

}

export default CreatePlaidLink
