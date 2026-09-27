"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import useGetAccounts from "../../hooks/useGetAccounts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <Button
        onClick={() => open()}
        disabled={!ready}
      >
        Link Account
      </Button>



      {items && Array.isArray(items) && items.map((item, i) => (
        <div className="flex items-center space-x-5" key={`item-${i}`}>
          {isItemError(item) &&
            <div className="flex items-center space-x-3">
              <div className="text-sm text-destructive">
                {item.error.display_message ?? item.error.error_message ?? 'This connection needs attention.'}
              </div>
              {item.error.error_code === 'ITEM_LOGIN_REQUIRED' &&
                <UpdatePlaidLink item_id={item.item_id} label="Login Required" onSuccess={afterUpdate} />
              }
            </div>
          }

          {!isItemError(item) &&
            <>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-muted-foreground text-sm">Institution</div>
                <div className="text-lg">{item.item?.institution_name}</div>
                <UpdatePlaidLink
                  item_id={item.item.item_id}
                  accountSelection
                  label="Manage accounts"
                  onSuccess={afterUpdate}
                />
              </div>


              <div key={`item-${i}`} className="flex space-x-5">
                {item?.accounts ? item.accounts.map((account: AccountBase, i: number) => (
                  <div key={`account-${i}`}>
                    <AccountCard
                      account={account}
                      item_id={item.item.item_id}
                      institutionName={item.item.institution_name}
                      itemAccounts={item.accounts}
                      onRemoved={refresh}
                    />
                  </div>
                ))
                  :
                  <div>
                    No Accounts Found
                  </div>
                }
              </div>
            </>
          }
        </div>

      ))}

      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Manual / Imported</CardTitle>
          <CardDescription>Transactions added by hand or uploaded from CSV, with no linked account.</CardDescription>
        </CardHeader>
        <CardContent>
          <IncludeInBudgetSwitch account_id={MANUAL_ACCOUNT_ID} />
        </CardContent>
      </Card>
    </div >
  )

}

export default CreatePlaidLink
