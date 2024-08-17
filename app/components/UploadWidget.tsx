import { Button } from "@tremor/react"
import csvtojson from "../helpers/csvtojson"
import { FormEventHandler, useEffect, useState } from "react"
import axios from "axios"
import { enqueueSnackbar } from "notistack"

export interface UploadWidgetProps<T> {
  data: T[]
  onChange?: (data: T[]) => void
}

export default function UploadWidget<T>({
  data,
  onChange = () => { }
}: UploadWidgetProps<T>) {
  const [loading, setLoading] = useState(false)
  const [fileReader, setFileReader] = useState<FileReader | null>(null)

  useEffect(() => {
    setFileReader(new FileReader())
  }, [data])

  const handleOnChange: FormEventHandler<HTMLInputElement> = (e) => {
    const files = (e.target as HTMLInputElement).files
    console.log(files)

    if (files === null) {
      return
    }

    if (fileReader) {
      fileReader.onload = async (event) => {
        if (!event.target) return
        const csvOutput = event.target.result as string
        const array = await csvtojson(csvOutput)
        if (array) onChange(array)
      }

      fileReader?.readAsText(files[0])

    }
  }

  const handleAddRecords = async () => {
    setLoading(true)
    if (!data.length) return

    try {
      const res = await axios.post('/api/transactions', data)
      enqueueSnackbar(`Success: ${data.length} records uploaded`, { variant: "success" })
      onChange([])

    } catch (error) {
      enqueueSnackbar("Something went wrong", { variant: "error" })
    }
    setLoading(false)
  }

  return (
    <>
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
          loading={loading}
        >
          Add Records
        </Button>
      </div>
    </>
  )

}
