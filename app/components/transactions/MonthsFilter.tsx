import useTableFilter from "@/app/hooks/useTableFilter"
import { TableFilterProps, TableFilterRow } from "../TableFilter"
import Transaction from "@/app/interfaces/transaction"
import { Popper } from "@mui/base/Popper"
import { ClickAwayListener } from "@mui/base/ClickAwayListener"
import { Button } from "@tremor/react"
import { RiAddFill, RiArrowDownSLine, RiDeleteBinFill } from "@remixicon/react"
import { useState } from "react"
import { aggregateByMonth } from "@/app/helpers/helperFunctions"

export interface MonthsFilterProps extends TableFilterProps<Transaction> {
  data: Transaction[]
}

const MonthsFilter = ({ data, columns, filterFns }: MonthsFilterProps) => {
  const {
    handleUpdateFilter,
  } = useTableFilter({ columns, filterFns })

  const filters: TableFilterRow<Transaction>[] = [
    {
      index: 0,
      filterData: {
        id: 'month',
      }
    }
  ]

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClickAway = () => {
    setAnchorEl(null)
  }

  const filterOpen = Boolean(anchorEl)
  const filterId = filterOpen ? 'simple-popper' : undefined

  const months = data && aggregateByMonth(data)

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div>
          <Button
            aria-describedby={filterId}
            className="rounded-lg bg-blue-500 text-white"
            type="button"
            onClick={handleClick}
          >
            <div className="flex items-center space-x-3">
              Select Month
              <RiArrowDownSLine />
            </div>
          </Button>

          <Popper
            id={filterId}
            open={filterOpen}
            anchorEl={anchorEl}
            className="m-1 dark:bg-dark-tremor-background rounded p-4 border border-gray-500 shadow"
            placement="bottom-start"
          >
            <div className="space-y-3">
              {filters.map((filter, index) =>
                <div className="flex items-center space-x-3" key={index}>
                  test
                </div>
              )}
            </div>
          </Popper>
        </div>
      </ClickAwayListener>



    </>
  )
}

export default MonthsFilter
