'use client'

import { Button, Card } from "@tremor/react"
import { FormEventHandler, useState } from "react"
import Table from "./Table"
import csvtojson from "../helpers/csvtojson"
import axios from "axios"
import transactionCols from "./transactions/transactionsColDefs"


const columns = transactionCols

export default function Upload() {
  const [data, setData] = useState<any[]>([])
  const fileReader = new FileReader()

  const handleOnChange: FormEventHandler<HTMLInputElement> = (e) => {
    const files = (e.target as HTMLInputElement).files

    if (files === null) {
      return
    }

    fileReader.onload = async (event) => {
      if (!event.target) return
      const csvOutput = event.target.result as string
      const array = await csvtojson(csvOutput)
      if (array) setData(array)
    }

    fileReader.readAsText(files[0])
  }

  const handleAddRecords = async () => {
    if (!data.length) return

    const res = await axios.post('/api/transactions', data)



  }

  return (
    <Card className="mx-auto space-y-4">

      <div className="max-w-md">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">Upload file</label>
        <input
          onChange={handleOnChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file"
        />
      </div>

      <div>
        <Button
          onClick={handleAddRecords}
          disabled={!data.length}
        >
          Add Records
        </Button>
      </div>

      <div className="mx-auto max-h-[400px] overflow-y-auto">
        <Table columns={columns} data={data} />
      </div>
    </Card>
  )

}
