import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"

interface UpdatePlaidLinkProps {
  client_user_id: string
  access_token?: string
}

const UpdatePlaidLink = ({
  client_user_id,
  access_token
}: UpdatePlaidLinkProps) => {

  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    async function createLinkToken() {
      const res = await fetch("/api/create-link-token", {
        method: "POST",
        body: JSON.stringify({
          client_user_id: client_user_id,
          access_token: access_token
        })
      })

      const data = await res.json()
      setLinkToken(data.link_token)
    }

    createLinkToken()
  }, [client_user_id, access_token])


  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess: (public_token: string, metadata: any) => {
      console.log("Update success: ", public_token)
    },
    onExit: (err: any, metadata: any) => {
      console.warn("User exited: ", err, metadata)
    }

  }

  const { open, ready } = usePlaidLink(config)

  return (
    <>
      <Button
        onClick={() => open()}
        disabled={!ready}
      >
        Login Required
      </Button>
    </>
  )
}


export default UpdatePlaidLink
