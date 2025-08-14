import { RecurringInsightsStream } from "plaid"
import { DataTable } from "../common/DataTable"
import recurringTransactionColumns from "./RecurringTransactionsColDefs"
import { TransactionStreamBalance } from "./ForecastCalendar"

export interface RecurringTransactionsTableProps {
  data: TransactionStreamBalance[]
}

const RecurringTransactionsTable = ({ data }: RecurringTransactionsTableProps) => {

  return (
    <>
      <DataTable
        columns={recurringTransactionColumns}
        data={data}
      />
    </>
  )

}

export default RecurringTransactionsTable
