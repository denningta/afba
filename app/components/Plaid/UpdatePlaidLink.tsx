import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { PlaidLinkError, usePlaidLink } from "react-plaid-link"
import { toast } from "sonner"

interface UpdatePlaidLinkProps {
  item_id: string
  // true: let the user change which accounts are shared with this item.
  // false: plain re-authentication (e.g. ITEM_LOGIN_REQUIRED).
  accountSelection?: boolean
  label: string
  onSuccess?: () => void
}

/**
 * Opens Plaid Link in update mode for an existing item. Update mode keeps the
 * same item and access token, so no public-token exchange is needed.
 */
const UpdatePlaidLink = ({
  item_id,
  accountSelection = false,
  label,
  onSuccess = () => { }
}: UpdatePlaidLinkProps) => {

  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    async function createLinkToken() {
      const res = await fetch("/api/update-link-token", {
        method: "POST",
        body: JSON.stringify({ item_id, accountSelection })
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message ?? 'Could not start Plaid update.')
        return
      }
      setLinkToken(data.link_token)
    }

    createLinkToken()
  }, [item_id, accountSelection])


  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: () => {
      toast.success(accountSelection ? 'Accounts updated.' : 'Connection updated.')
      onSuccess()
    },
    onExit: (err: PlaidLinkError | null) => {
      if (err) toast.error(err.display_message ?? err.error_message ?? 'Plaid update was not completed.')
    }
  })

  return (
    <Button
      variant="outline"
      onClick={() => open()}
      disabled={!ready}
    >
      {label}
    </Button>
  )
}


export default UpdatePlaidLink
