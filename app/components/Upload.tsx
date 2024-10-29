'use client'

import { Card } from "@tremor/react"
import { useState } from "react"
import transactionCols from "./transactions/transactionsColDefs"
import { SnackbarProvider } from "notistack"
import UploadWidget from "./UploadWidget"
import { DataTable } from "./common/DataTable"

const columns = transactionCols

export default function Upload() {
  const [data, setData] = useState<any[]>([])

  return (
    <Card className="mx-auto space-y-4">
      <UploadWidget data={data} onChange={setData} />

      <div className="mx-auto max-h-[400px] overflow-y-auto">
        <DataTable columns={columns} data={data} />
      </div>
      <SnackbarProvider />
    </Card>
  )

}
