'use client'

import { useRef, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { FileUpIcon, Loader2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import csvtojson from "../helpers/csvtojson"
import transactionCols from "./transactions/transactionsColDefs"
import { DEFAULT_TRANSACTION_COLUMN_VISIBILITY } from "./transactions/TransactionsTable"
import { DataTable } from "./common/DataTable/DataTable"

export default function Upload() {
  const [data, setData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate } = useSWRConfig()

  const readFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const rows = await csvtojson(await file.text())
      setData(rows ?? [])
      setFileName(file.name)
      if (!rows?.length) toast.error(`No rows found in ${file.name}.`)
    } catch {
      toast.error(`Couldn't read ${file.name}. Is it a CSV file?`)
    }
  }

  const clear = () => {
    setData([])
    setFileName(null)
    // Let the same file be chosen again after clearing.
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleImport = async () => {
    if (!data.length) return
    setImporting(true)
    try {
      await axios.post('/api/transactions', data)
      toast.success(`Imported ${data.length} transaction${data.length === 1 ? '' : 's'}.`)
      clear()
      // Refresh every cached transactions list (the table, badges, dashboard).
      mutate(key => typeof key === 'string' && key.startsWith('/api/transactions'))
    } catch {
      toast.error("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV file</CardTitle>
          <CardDescription>The first row must be column headers, including date and amount.</CardDescription>
          {data.length > 0 &&
            <CardAction className="flex gap-2">
              <Button variant="ghost" onClick={clear} disabled={importing}>
                <XIcon />
                Clear
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2Icon className="animate-spin" />}
                Import {data.length} transaction{data.length === 1 ? '' : 's'}
              </Button>
            </CardAction>
          }
        </CardHeader>
        <CardContent>
          <label
            htmlFor="csv-file"
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              readFile(e.dataTransfer.files[0])
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/40",
              dragging && "border-primary bg-primary/5",
            )}
          >
            <FileUpIcon className="size-8 text-muted-foreground" />
            {fileName
              ? <>
                <span className="font-medium">{fileName}</span>
                <span className="text-sm text-muted-foreground">{data.length} row{data.length === 1 ? '' : 's'} ready to import · choose another file to replace</span>
              </>
              : <>
                <span className="font-medium">Drop a CSV file here, or click to choose one</span>
                <span className="text-sm text-muted-foreground">Rows are previewed below before anything is saved.</span>
              </>
            }
            <input
              ref={inputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={e => readFile(e.target.files?.[0])}
            />
          </label>
        </CardContent>
      </Card>

      {data.length > 0 &&
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Preview</h2>
          <DataTable
            columns={transactionCols}
            data={data}
            columnVisibilityStorageKey="afba:transactions-columns"
            defaultColumnVisibility={DEFAULT_TRANSACTION_COLUMN_VISIBILITY}
          />
        </section>
      }
    </div>
  )
}
