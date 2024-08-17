'use client'

import { Card } from "@tremor/react"
import { useState } from "react"
import Table from "./Table"
import transactionCols from "./transactions/transactionsColDefs"
import { SnackbarProvider } from "notistack"
import UploadWidget from "./UploadWidget"

const columns = transactionCols

export default function Upload() {
  const [data, setData] = useState<any[]>([])

  return (
    <Card className="mx-auto space-y-4">
      <UploadWidget data={data} onChange={setData} />

      <div className="mx-auto max-h-[400px] overflow-y-auto">
        <Table columns={columns} data={data} />
      </div>
      <SnackbarProvider />
    </Card>
  )

}
