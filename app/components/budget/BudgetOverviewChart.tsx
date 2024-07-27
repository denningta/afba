import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale"
import { AxisBottom } from "@visx/axis"
import { Group } from "@visx/group"
import { BarGroup } from "@visx/shape"
import { BudgetOverview } from "./BudgetOverview";
import { useRouter } from "next/navigation"
import { dateToYYYYMM, getPrevMonth, monthDiff } from "@/app/helpers/helperFunctions";

export interface BudgetOverviewProps {
  data: BudgetOverview[]
  start: string
  end: string
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
}

const getDate = (budget: BudgetOverview) => budget.date

const defaultMargin = { top: 40, right: 0, bottom: 40, left: 0 };
const keys = ['totalBudget', 'totalSpent']
const background = '#612efb'
const colors = ['#aeeef8', '#e5fd3d']

const getPlaceholderData = (
  data: BudgetOverview[],
  start: string,
  end: string
) => {
  let placeholderData: BudgetOverview[] = []

  const monthsDiff = monthDiff(new Date(start), new Date(end))

  for (let index = 0; index <= monthsDiff; index++) {
    const dateStr = getPrevMonth(end, index)


    placeholderData.unshift({
      _id: dateStr,
      date: dateStr,
      totalSpent: 0,
      totalBudget: 0,
      categories: []
    })
  }

  const pData = placeholderData.map(placeholder =>
    data.find(el => el.date === placeholder.date) ?? placeholder
  )

  return pData
}

const BudgetOverviewChart = ({
  data,
  start,
  end,
  width,
  height,
  margin = defaultMargin
}: BudgetOverviewProps) => {
  const router = useRouter()

  const placeholderData = getPlaceholderData(data, start, end)

  const dateScale = scaleBand<string>({
    domain: placeholderData.map(getDate),
    padding: 0.2
  })

  const groupScale = scaleBand<string>({
    domain: keys,
    padding: 0.1
  })

  const dollarScale = scaleLinear<number>({
    domain: [0, 8000]
  })

  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: colors
  })

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // update scale output dimensions
  dateScale.rangeRound([0, xMax]);
  groupScale.rangeRound([0, dateScale.bandwidth()]);
  dollarScale.range([yMax, 0]);

  const handleGroupClick = (budget: BudgetOverview) => {
    router.push(`budget/${budget.date}`)
  }

  return (
    <svg
      width={width}
      height={height}
    >
      <rect x={0} y={0} width={width} height={height} fill={background} rx={14} />
      <Group
        top={margin.top}
        left={margin.left}
      >
        <BarGroup
          data={placeholderData}
          keys={keys}
          color={colorScale}
          height={yMax}
          x0={getDate}
          x0Scale={dateScale}
          x1Scale={groupScale}
          yScale={dollarScale}
        >
          {(barGroups) => {
            return barGroups.map((barGroup, dateIndex) => {
              const groupWidth = barGroup.bars.reduce(((prev, curr) => prev + curr.width), 0)
              return (
                <Group
                  key={`bar-group-${barGroup.index}-${barGroup.x0}`}
                  left={barGroup.x0}
                  className="cursor-pointer"
                  onClick={() => handleGroupClick(placeholderData[barGroup.index])}
                >
                  {barGroup.bars.map((bar, stackIndex) => {
                    const barData = data[dateIndex]
                    const stackData = barData && barData.categories

                    // TODO: Create Stacked bar chart: use barData.key = "totalSpent" | "totalBudget"

                    return (
                      bar.height > 0 ? <rect
                        key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}`}
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height >= 0 ? bar.height : 0}
                        fill={bar.color}
                        rx={4}
                      />
                        : <rect
                          key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}`}
                          x={bar.x}
                          y={-19}
                          width={bar.width}
                          height={491}
                          fill={background}
                          rx={4}
                        />
                    )
                  })}
                </Group>
              )
            })
          }}
        </BarGroup>
      </Group>
      <AxisBottom
        top={yMax + margin.top}
        scale={dateScale}
        hideAxisLine
        tickStroke="#ffffff"
        tickLabelProps={{
          fill: '#ffffff',
          fontSize: 11,
          textAnchor: "middle",
        }}
      />
    </svg>
  )
}

export default BudgetOverviewChart
