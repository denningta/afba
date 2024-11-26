'use client'

import columns from "./transactionsColDefs"
import TransactionForm from "./TransactionForm"
import useTransactions from "@/app/hooks/useTransactions"
import { TransactionsFilter } from "@/app/queries/transactions"
import { DataTable } from "../common/DataTable"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileWarning, PlusIcon, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import useCheckDuplicates from "@/app/hooks/useCheckDuplicates"
import { toast } from "sonner"
import { useEffect } from "react"

interface TransactionsTableProps {
  searchParams?: TransactionsFilter
}

export default function TransactionsTable({
  searchParams,
}: TransactionsTableProps) {

  const {
    data,
  } = useTransactions(searchParams ?? {})
  const duplicates = useCheckDuplicates()
  const duplicateData = duplicates?.data?.map(el => el.transactions).flat()

  useEffect(() => {
    if (!duplicates.data?.length) return
    toast.warning(
      <div className="flex items-center space-x-4">
        <TriangleAlert />
        <div className="flex flex-col">
          <div className="flex items-center">
            Warning: There are {duplicates.data.length} potential duplicates
          </div>
          <div>
            Click here to view
          </div>
        </div>
      </div>
    )

  }, [duplicates.data])


  const handleAddTransaction = async () => {
  }


  return (
    <div>
      <div className="flex items-center space-x-6 mb-4">
        <div className="grow"></div>

        {duplicates.data?.length &&
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <TriangleAlert />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-fit max-h-screen overflow-auto">
              <DialogTitle>Potential Trasaction Duplicates</DialogTitle>
              <DialogDescription>These records may be dupliacates of eachother.</DialogDescription>
              <DataTable
                columns={columns}
                data={duplicateData ?? []}
              />
            </DialogContent>
          </Dialog>
        }

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusIcon />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Use this form to add a transaction to the table.</DialogDescription>
            <TransactionForm onSubmit={handleAddTransaction} />
          </DialogContent>
        </Dialog>

      </div>

      <DataTable
        data={data ?? []}
        columns={columns}
      />
    </div>
  )
}
