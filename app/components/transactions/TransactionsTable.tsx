'use client'

import Transaction from "@/app/interfaces/transaction"
import { useEffect, useState } from "react"
import Table from "../Table"
import columns from "./transactionsColDefs"
import { Card } from "@tremor/react"



export default function TransactionsTable() {
  const [data, setData] = useState<Transaction[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <div className="overflow-scroll">
        <Table data={data} columns={columns} />
      </div>
    </Card>
  )
}
