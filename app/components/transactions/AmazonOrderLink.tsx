"use client"

import * as React from "react"
import { ExternalLink, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import useTransactions from "@/app/hooks/useTransactions"
import Transaction from "@/app/interfaces/transaction"
import { AMAZON_TRANSACTIONS_URL } from "./transactionsColDefs"

export interface AmazonOrderLinkProps {
  transaction: Transaction
}

export default function AmazonOrderLink({ transaction }: AmazonOrderLinkProps) {
  const { upsertRecord } = useTransactions()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState(transaction.amazonOrderUrl ?? '')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setUrl(transaction.amazonOrderUrl ?? '')
  }

  const handleSave = async () => {
    await upsertRecord({ ...transaction, amazonOrderUrl: url.trim() || undefined })
    setOpen(false)
  }

  const handleClear = async () => {
    await upsertRecord({ ...transaction, amazonOrderUrl: undefined })
    setUrl('')
    setOpen(false)
  }

  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon-sm" asChild>
        <a
          href={transaction.amazonOrderUrl || AMAZON_TRANSACTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={transaction.amazonOrderUrl ? "View the saved order on Amazon" : "View this purchase on Amazon"}
        >
          <ExternalLink />
        </a>
      </Button>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            title={transaction.amazonOrderUrl ? "Edit saved order link" : "Save this order's link"}
          >
            <LinkIcon className={transaction.amazonOrderUrl ? "text-primary" : "opacity-50"} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Amazon order link</div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste this order's Amazon URL.."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              {transaction.amazonOrderUrl && (
                <Button size="sm" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              )}
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
