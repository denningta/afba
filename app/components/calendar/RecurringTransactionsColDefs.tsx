import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { RecurringInsightsStream, RecurringTransactions } from "plaid";
import { TransactionStreamBalance } from "./ForecastCalendar";

const columnHelper = createColumnHelper<TransactionStreamBalance>()

const recurringTransactionColumns: ColumnDef<TransactionStreamBalance, any>[] = [
  columnHelper.accessor('merchant_name', {
    header: 'Merchant'
  }),
  columnHelper.accessor('description', {
    header: 'Description'
  }),
  columnHelper.accessor('predicted_next_date', {
    header: 'Predicted Next Date'
  }),
  columnHelper.accessor('last_amount.amount', {
    header: 'Last Amount'
  }),
  columnHelper.accessor('average_amount.amount', {
    header: 'Average Amount'
  }),
  columnHelper.accessor('personal_finance_category.primary', {
    header: 'Category'
  })
]

export default recurringTransactionColumns
