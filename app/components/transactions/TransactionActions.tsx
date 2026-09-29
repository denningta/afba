import React, { useState } from "react";
import Transaction from "@/app/interfaces/transaction";
import useTransactions from "@/app/hooks/useTransactions";
import TransactionForm from "./TransactionForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, SearchIcon } from "lucide-react";
import JsonView from "@uiw/react-json-view"
import { githubDarkTheme } from "@uiw/react-json-view/githubDark"
import { githubLightTheme } from "@uiw/react-json-view/githubLight"
import { useTheme } from "next-themes"
import { Fragment } from "react"
import { formatShortDate, humanizeEnum } from "@/app/helpers/helperFunctions"
import { Amount, MerchantLogo } from "./TransactionCells"

interface EditTransactionProps {
  transaction: Transaction
}

export default function TransactionActions({
  transaction
}: EditTransactionProps) {
  const [dialogMenu, setDialogMenu] = useState<string>('none')

  const handleDialogMenu = (): React.JSX.Element | null => {

    switch (dialogMenu) {
      case "view-transaction":
        return <TransactionDetailsDialog
          transaction={transaction}
          onClose={() => setDialogMenu('none')}
        />
      default:
        return null
    }
  }

  return (
    <Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label="Transaction actions"
            tabIndex={-1}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">

          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={() => setDialogMenu("view-transaction")}>
              <SearchIcon /> View details
            </DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuItem
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {handleDialogMenu()}
    </Dialog>
  )

}


export interface TransactionDetailsDialogProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetailsDialog({ transaction, onClose }: TransactionDetailsDialogProps) {
  const { resolvedTheme } = useTheme()
  const merchant = transaction.merchant_name || transaction.name
  const account = transaction.account
    ? `${transaction.account.name}${transaction.account.mask ? ` ••${transaction.account.mask}` : ''}`
    : transaction.account_id ? 'Unknown account' : 'Manual / Imported'

  const facts: [string, React.ReactNode][] = [
    ['Date', formatShortDate(transaction.date)],
    ['Amount', <Amount key="amount" value={transaction.amount ?? 0} />],
    ['Description', transaction.name || '—'],
    ['Account', account],
    ['Category', transaction.userCategory?.name ?? 'Uncategorized'],
    ['Plaid category', humanizeEnum(transaction.personal_finance_category?.primary) || '—'],
    ['Status', transaction.pending ? 'Pending' : 'Posted'],
  ]

  return (
    <DialogContent
      className={[
        // Full screen on mobile - no floating card, no side margins.
        "top-0 left-0 flex h-dvh max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-4",
        // Floating and centered from sm: up.
        "sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85dvh] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6",
      ].join(" ")}
    >
      <DialogHeader>
        <div className="flex items-center gap-3">
          <MerchantLogo src={transaction.logo_url} name={merchant} />
          <DialogTitle className="truncate">{merchant}</DialogTitle>
        </div>
        <DialogDescription>Everything we know about this transaction.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {facts.map(([label, value]) => (
            <Fragment key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 truncate">{value}</dd>
            </Fragment>
          ))}
        </dl>
        <details className="group rounded-lg border">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">Raw data</summary>
          <div className="overflow-x-auto border-t p-3 text-xs">
            <JsonView
              value={transaction}
              style={resolvedTheme === 'dark' ? githubDarkTheme : githubLightTheme}
              collapsed={2}
              displayDataTypes={false}
            />
          </div>
        </details>
      </div>
    </DialogContent>
  )
}

export interface EditTransactionDialogProps {
  transaction: Transaction
  onClose: () => void
}

export function EditTransactionDialog({ transaction, onClose }: EditTransactionDialogProps) {
  const { upsertRecord } = useTransactions()

  const handleUpdateTransaction = async (value: Transaction) => {
    try {
      await upsertRecord({ ...transaction, ...value })

    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogDescription>
          Make changes to this budget category.
        </DialogDescription>
      </DialogHeader>
      <TransactionForm
        initialValues={transaction}
        onSubmit={(value) => handleUpdateTransaction(value)}
      />
    </DialogContent>
  )
}
