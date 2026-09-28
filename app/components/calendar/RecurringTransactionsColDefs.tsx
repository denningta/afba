import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { RecurringInsightsStream, RecurringTransactions } from "plaid";
import { TransactionStreamBalance } from "./ForecastCalendar";
import { formatShortDate, humanizeEnum, toCurrency } from "@/app/helpers/helperFunctions";
import { EmptyCell } from "../common/DataTable/cells";

const columnHelper = createColumnHelper<TransactionStreamBalance>()

const recurringTransactionColumns: ColumnDef<TransactionStreamBalance, any>[] = [
  columnHelper.accessor('merchant_name', {
    header: 'Merchant',
    cell: info => info.getValue()
      ? <span className="font-medium">{info.getValue()}</span>
      : <EmptyCell />,
    meta: { truncate: true },
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => <span className="text-muted-foreground">{info.getValue() || <EmptyCell />}</span>,
    meta: { truncate: true },
  }),
  columnHelper.accessor('predicted_next_date', {
    header: 'Next Date',
    cell: info => info.getValue()
      ? <span className="tabular-nums text-muted-foreground" title={info.getValue()}>{formatShortDate(info.getValue())}</span>
      : <EmptyCell />,
    meta: { width: 112 },
  }),
  columnHelper.accessor('last_amount.amount', {
    header: 'Last Amount',
    meta: { align: 'right', width: 130 },
    cell: info => toCurrency(info.getValue() ?? 0)
  }),
  columnHelper.accessor('average_amount.amount', {
    header: 'Average Amount',
    meta: { align: 'right', width: 130 },
    cell: info => toCurrency(info.getValue() ?? 0)
  }),
  columnHelper.accessor('personal_finance_category.primary', {
    header: 'Category',
    cell: info => info.getValue()
      ? <span className="text-muted-foreground">{humanizeEnum(info.getValue())}</span>
      : <EmptyCell />,
  })
]

export default recurringTransactionColumns
