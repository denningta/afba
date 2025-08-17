"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import useGetAccounts from "../../hooks/useGetAccounts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AccountCard from "./AccountCard"
import useGetUser from "@/app/hooks/useGetUser"
import UpdatePlaidLink from "./UpdatePlaidLink"
import { AccountBase } from "plaid"


const client_user_id = 'root-user'

const CreatePlaidLink = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const { items, error } = useGetAccounts({ userId: client_user_id })
  const userRes = useGetUser({ userId: client_user_id })
  console.log(items)

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
      console.log('Access token exchange success: ', data)

    } catch (err: any) {
      console.error(err)
      throw new Error(err)
    }
  }, [])

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
          {error && error.error_code === 'ITEM_LOGIN_REQUIRED' &&
            <UpdatePlaidLink
              client_user_id={client_user_id}
              access_token={userRes?.user?.items[0].plaidAccessToken}
            />
          }

          {!error &&
            <>
              <div className="flex flex-col items-center">
                <div className="text-muted-foreground text-sm">Institution</div>
                <div className="text-lg">{item.item?.institution_name}</div>
              </div>


              <div key={`item-${i}`} className="flex space-x-5">
                {item?.accounts ? item.accounts.map((account: AccountBase, i: number) => (
                  <div key={`account-${i}`}>
                    <AccountCard account={account} />
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
    </div >
  )

}

export default CreatePlaidLink
