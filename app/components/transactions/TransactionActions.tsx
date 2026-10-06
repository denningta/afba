import React, { useState } from "react";
import Transaction, { isManualTransaction, transactionLabel } from "@/app/interfaces/transaction";
import useTransactions from "@/app/hooks/useTransactions";
import TransactionForm, { TransactionFormValues } from "./TransactionForm";
import type { TransactionFieldUpdate } from "@/app/queries/transaction";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";
import DeleteTransactionsDialog from "./DeleteTransactionsDialog";
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

type ActionDialog = 'details' | 'edit' | 'delete' | null

export default function TransactionActions({
  transaction
}: EditTransactionProps) {
  const [dialog, setDialog] = useState<ActionDialog>(null)
  const close = () => setDialog(null)

  return (
    <>
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
          <DropdownMenuItem onSelect={() => setDialog('details')}>
            <SearchIcon /> View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('edit')}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dialog === 'details' || dialog === 'edit'} onOpenChange={open => { if (!open) close() }}>
        {dialog === 'details' && <TransactionDetailsDialog transaction={transaction} onClose={close} />}
        {dialog === 'edit' && <EditTransactionDialog transaction={transaction} onClose={close} />}
      </Dialog>
      <DeleteTransactionsDialog
        transactions={dialog === 'delete' ? [transaction] : []}
        onOpenChange={open => { if (!open) close() }}
      />
    </>
  )
}


export interface TransactionDetailsDialogProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetailsDialog({ transaction, onClose }: TransactionDetailsDialogProps) {
  const { resolvedTheme } = useTheme()
  const merchant = transactionLabel(transaction)
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
  const { updateTransaction, setCategory } = useTransactions()
  const manual = isManualTransaction(transaction)

  const handleSubmit = async ({ name, amount, date, category }: TransactionFormValues) => {
    // A bank transaction's name is stored as our own displayName; matching the
    // bank's name again clears it.
    const fields: TransactionFieldUpdate = manual
      ? { name, amount, date }
      : { displayName: name === (transaction.merchant_name || transaction.name) ? null : name }
    if (!await updateTransaction(transaction, fields)) return "Couldn't save the transaction."
    const categoryChanged = String(category?._id ?? '') !== String(transaction.userCategory?._id ?? '')
    if (categoryChanged && !await setCategory({ ...transaction, ...fields } as Transaction, category)) {
      return "Saved, but couldn't change the category."
    }
    toast.success('Transaction saved.')
    onClose()
    return null
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit transaction</DialogTitle>
        <DialogDescription>
          {manual ? 'Change any detail of this transaction.' : 'Rename it or change its category. The bank keeps its own name for it too.'}
        </DialogDescription>
      </DialogHeader>
      <TransactionForm transaction={transaction} onSubmit={handleSubmit} />
    </DialogContent>
  )
}
