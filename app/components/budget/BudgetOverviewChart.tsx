import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { Group } from "@visx/group"
import { BarGroup } from "@visx/shape"
import { BudgetOverview } from "./BudgetOverview";
import { useRouter } from "next/navigation"
import { getPrevMonth, monthDiff, toCurrency } from "@/app/helpers/helperFunctions";
import { schemePaired } from "d3"
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip"
import { PatternLines } from "@visx/pattern"
import { localPoint } from "@visx/event"
import { Category } from "@/app/interfaces/categories";
import { CSSProperties, useEffect, useState } from "react";
import Transaction from "@/app/interfaces/transaction";

export interface BudgetOverviewProps {
  data: BudgetOverview[]
  start: string
  end: string
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
  onFilterChange?: (data: BarStackData | null) => void
}

export interface BarStackData extends Category {
  key?: string
  name?: string
  budget?: number
  spent?: number
  height?: number
  y?: number
  transactions?: Transaction[]
  date?: string
}


const getDate = (budget: BudgetOverview) => budget.date

const defaultMargin = { top: 40, right: 0, bottom: 40, left: 0 };
const keys = ['totalBudget', 'totalSpent']
const background = '#0000'
const colors = ['#aeeef8', '#e5fd3d']
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
};

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
      categories: [],
      transactions: []
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
  margin = defaultMargin,
  onFilterChange = () => { }
}: BudgetOverviewProps) => {
  const router = useRouter()
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<any>()
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });
  let tooltipTimeout: number

  const placeholderData = getPlaceholderData(data, start, end)

  const [barSelected, setBarSelected] = useState<BarStackData | null>(null)

  useEffect(() => {
    onFilterChange(barSelected)
  }, [barSelected])

  const dateScale = scaleBand<string>({
    domain: placeholderData.map(getDate),
    padding: 0.2
  })

  const groupScale = scaleBand<string>({
    domain: keys,
    padding: 0.1
  })

  const dollarScaleMax = Math.max(...data.map(el => Math.max(...[el.totalSpent, el.totalBudget])))
  const dollarScale = scaleLinear<number>({
    domain: [0, dollarScaleMax]
  })

  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: colors
  })

  const categoryKeys = data.map(el => el.categories).flat()
    .map(el => el.name).filter(el => el !== null) as string[]



  const budgetColorScale = scaleOrdinal<string, string>({
    domain: categoryKeys,
    range: schemePaired as string[]
  })

  const spentColorScale = scaleOrdinal<string, string>({
    domain: categoryKeys,
    range: schemePaired as string[]
  })

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // update scale output dimensions
  dateScale.rangeRound([0, xMax]);
  groupScale.rangeRound([0, dateScale.bandwidth()]);
  dollarScale.range([yMax, 0]);

  const handleGoToBudget = (date: string) => {
    // router.push(`budget/${date}`)
    const transactions = placeholderData.find(el => el.date === date)?.transactions
    setBarSelected({
      key: date,
      date: date,
      transactions: transactions || undefined
    })

  }

  const handleBarClick = (data: BarStackData) => {
    setBarSelected(data)
  }

  const getBarSelectedStyle = (barStackData: BarStackData): CSSProperties => {
    if (!barSelected) {
      return {
        fillOpacity: 1
      }
    }

    if (barSelected.key === barStackData.date) {
      return {
        fillOpacity: 1,
        strokeWidth: 1
      }
    }

    if (barSelected.key === barStackData.key) {
      return {
        fillOpacity: 1,
        strokeWidth: 1,
        stroke: 'white'
      }
    }

    return {
      fillOpacity: 0.5,
      strokeWidth: 0
    }
  }

  return (
    <div>
      <svg
        ref={containerRef}
        width={width}
        height={height}
      >
        <rect x={0} y={0} width={width} height={height} fill={background} rx={14}
          onClick={() => setBarSelected(null)}
        />
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
                const groupWidth = (barGroup.bars[1].x + barGroup.bars[1].width) - barGroup.bars[0].x

                return (
                  <Group
                    key={`bar-group-${barGroup.index}-${barGroup.x0}`}
                    left={barGroup.x0}
                    className="cursor-pointer"
                  >
                    {barGroup.bars.map((bar, i) => {
                      if (bar.height <= 0) {
                        return (
                          <Group
                            key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}-${i}`}
                          >
                            <PatternLines
                              id={"lines"}
                              width={10}
                              height={10}
                              stroke="white"
                              strokeWidth={3}
                              orientation={['diagonalRightToLeft']}
                            />
                            <rect
                              x={bar.x}
                              y={bar.y - yMax}
                              width={bar.width}
                              height={yMax}
                              fill={`url(#lines)`}
                              fillOpacity={0.05}
                            />

                          </Group>
                        )

                      }
                      const barData = placeholderData[dateIndex]
                      return barData && barData.categories
                        .sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0))
                        .map(
                          function(this: { heightAcc: number }, category: any, i) {
                            const { spent, budget } = category

                            let barStackData: BarStackData = { ...category }

                            if (bar.key === 'totalBudget') {
                              barStackData.height = bar.height * budget / barData.totalBudget
                            }
                            if (bar.key === 'totalSpent') {
                              barStackData.height = bar.height * spent / barData.totalSpent
                            }

                            barStackData.y = this.heightAcc
                            barStackData.key = `bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}-${i}`
                            barStackData.date = barData.date

                            this.heightAcc = barStackData.y + (barStackData?.height ?? 0)

                            return (
                              <rect
                                key={barStackData.key}
                                x={bar.x}
                                y={barStackData.y}
                                height={barStackData.height}
                                width={bar.width}
                                fill={bar.key === 'totalBudget' ? budgetColorScale(barStackData?.name ?? '') : spentColorScale(barStackData?.name ?? '')}
                                style={getBarSelectedStyle(barStackData)}
                                onMouseLeave={() => {
                                  tooltipTimeout = window.setTimeout(() => {
                                    hideTooltip()
                                  }, 100)
                                }}
                                onMouseMove={(event) => {
                                  if (tooltipTimeout) clearTimeout(tooltipTimeout)
                                  showTooltip({
                                    tooltipData: {
                                      ...barStackData,
                                      key: bar.key
                                    },
                                    tooltipTop: localPoint(event)?.y,
                                    tooltipLeft: localPoint(event)?.x
                                  })
                                }}
                                onClick={() => handleBarClick(barStackData)}
                              />
                            )
                          }, { heightAcc: bar.y })
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
            cursor: "pointer",
            onClick: (e) => { e.currentTarget.textContent && handleGoToBudget(e.currentTarget.textContent) }
          }}
        />
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div className="p-2 space-y-3">
            <div style={{ color: colorScale(tooltipData.key) }}>
              <strong>{tooltipData.key === 'totalBudget' ? 'Budget' : 'Spent'}</strong>
            </div>
            <div>
              <span style={{ color: budgetColorScale(tooltipData.name) }} className="font-bold">{tooltipData.name}: </span>
              {tooltipData.key === 'totalBudget' ?
                <span> {toCurrency(tooltipData.budget)}</span>
                : <span>{toCurrency(tooltipData.spent)}</span>
              }
            </div>
          </div>
        </TooltipInPortal>
      )}

    </div>
  )
}

export default BudgetOverviewChart
