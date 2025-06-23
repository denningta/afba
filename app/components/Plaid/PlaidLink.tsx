"use client"

import { Button } from "@/components/ui/button"
import axios from "axios"
import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import useGetAccounts from "../../hooks/useGetAccounts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import useSyncTransactions from "../../hooks/useSyncTransactions"
import AccountCard from "./AccountCard"


const client_user_id = 'root-user'

const CreatePlaidLink = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const { items, error } = useGetAccounts({ userId: client_user_id })

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        body: JSON.stringify({ client_user_id })
      })

      const data = await response.json()
      setLinkToken(data.link_token)
    }

    createLinkToken()
  }, [])

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    const response = await fetch('/api/exchange-public-token', {
      method: 'POST',
      body: JSON.stringify({ client_user_id, public_token })
    })

    const data = await response.json()
    console.log('Access token exchange success: ', data)

  }, [])

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess
  }


  const { open, ready } = usePlaidLink(config)

  const handleSyncTransactions = async (account_id: string) => {
    const res = await axios.post('/api/transactions/sync', {
      userId: 'root-user',
      account_id
    })
    console.log(res.data)
  }

  return (
    <div className="space-y-6">
      <Button
        onClick={() => open()}
        disabled={!ready}
      >
        Link Account
      </Button>

      <Card className="max-w-fit">
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>Accounts connected to this app through Plaid</CardDescription>
        </CardHeader>
        <CardContent>

          {items && items.map((item, i) => (
            <div className="flex items-center space-x-5" key={`item-${i}`}>
              <div className="flex flex-col items-center">
                <div className="text-muted-foreground text-sm">Institution</div>
                <div className="text-lg">{item.item.institution_name}</div>
              </div>


              <div key={`item-${i}`} className="flex space-x-5">
                {item.accounts.map((account, i) => (
                  <div key={`account-${i}`}>
                    <AccountCard account={account} />
                  </div>
                ))}
              </div>
            </div>

          ))}

        </CardContent>
      </Card>


    </div>
  )

}

export default CreatePlaidLink
