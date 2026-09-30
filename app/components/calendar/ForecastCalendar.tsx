"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { addDays, format, parseISO } from "date-fns"
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts"
import { CheckIcon, PlusIcon } from "lucide-react"
import useAccounts from "@/app/hooks/useAccounts"
import useForecast from "@/app/hooks/useForecast"
import { buildForecast, ForecastPoint } from "@/app/lib/forecast"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { ForecastSource, ForecastStream, ScheduledTransaction } from "@/app/interfaces/forecast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import PageHeader from "../common/PageHeader"
import { EmptyState, ErrorState } from "../common/StateMessage"
import { Amount } from "../transactions/TransactionCells"
import UpcomingList from "./UpcomingList"
import ScheduledItemDialog from "./ScheduledItemDialog"
import StreamOverrideDialog from "./StreamOverrideDialog"
import ForecastExplainSheet, { ForecastKpiKey } from "./ForecastExplainSheet"
import { ExplainTrigger } from "../common/ExplainSheet"

const HORIZONS = [30, 60, 90] as const

const SOURCE_LABELS: Record<ForecastSource, string> = {
  recurring: 'Recurring',
  budget: 'Budgeted spending',
  scheduled: 'Scheduled',
}

const chartConfig = {
  balance: { label: "Projected balance", color: "var(--chart-1)" },
} satisfies ChartConfig

function StatCard({ label, value, detail, tone, onExplain }: {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  tone?: 'negative'
  onExplain: () => void
}) {
  return (
    <ExplainTrigger onClick={onExplain}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className={cn("text-2xl font-semibold tracking-tight tabular-nums", tone === 'negative' && "text-negative")}>
            {value}
          </CardTitle>
        </CardHeader>
        {detail && <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>}
  </Card>
    </ExplainTrigger>
  )
}

// Projected balance for one account, from what's known to be coming: Plaid's
// recurring bills and paychecks, the unspent budget, and items you add.
const ForecastCalendar = () => {
  const { data: accounts, error: accountsError } = useAccounts()
  // Plaid-linked checking/savings accounts, checking first.
  const linked = useMemo(() => (accounts ?? [])
    .filter(a => a.item_id && a.type === 'depository')
    .sort((a, b) => Number(b.subtype === 'checking') - Number(a.subtype === 'checking')), [accounts])

  const [chosenAccountId, setChosenAccountId] = useState<string | null>(null)
  const accountId = chosenAccountId ?? linked[0]?.account_id ?? null

  const [days, setDays] = useState<number>(30)
  const [sources, setSources] = useState<Record<ForecastSource, boolean>>({ recurring: true, budget: true, scheduled: true })
  // Late items are usually already pending at the bank, and some banks (USAA)
  // include pending transactions in the balance Plaid reports - so counting
  // them by default would double count. The user can opt in.
  const [countLate, setCountLate] = useState(false)

  const { data, error, isLoading, mutate, saveScheduled, deleteScheduled, saveOverride, resetOverride } = useForecast(accountId)

  const [scheduledDialog, setScheduledDialog] = useState<{ open: boolean, item?: ScheduledTransaction }>({ open: false })
  const [editingStream, setEditingStream] = useState<ForecastStream | null>(null)
  const [deleting, setDeleting] = useState<ScheduledTransaction | null>(null)
  const [explaining, setExplaining] = useState<ForecastKpiKey | null>(null)

  const forecast = useMemo(() => {
    if (!data) return null
    const to = format(addDays(parseISO(data.from), days), 'yyyy-MM-dd')
    return buildForecast({
      startBalance: data.startBalance,
      events: data.events.filter(e => sources[e.source] && e.date <= to && (!e.late || countLate)),
      from: data.from,
      days,
    })
  }, [data, days, sources, countLate])

  const lateEvents = data?.events.filter(e => e.late && sources[e.source]) ?? []

  const hasBudget = data?.events.some(e => e.source === 'budget') ?? false
  const change = forecast && data ? forecast.end - data.startBalance : 0

  const accountPicker = linked.length > 0 &&
    <Select value={accountId ?? undefined} onValueChange={setChosenAccountId}>
      <SelectTrigger className="w-[240px]" aria-label="Account">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {linked.map(a => (
          <SelectItem key={a.account_id} value={a.account_id}>
            {a.name}{a.mask ? ` ••${a.mask}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecast"
        description="Projected balance from recurring bills and paychecks, your remaining budget, and items you schedule."
        actions={<>
          {accountPicker}
          {accountId &&
            <Button onClick={() => setScheduledDialog({ open: true })}>
              <PlusIcon />
              Add scheduled item
            </Button>
          }
        </>}
      />

      {accountsError &&
        <Card><ErrorState title="Couldn't load accounts" error={accountsError} /></Card>
      }

      {accounts && linked.length === 0 &&
        <Card>
          <EmptyState
            title="No bank account to forecast"
            description="Link a checking or savings account so Plaid can detect your recurring bills and paychecks."
            action={<Button variant="outline" asChild><Link href="/connect">Link an account</Link></Button>}
          />
        </Card>
      }

      {accountId && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList aria-label="Forecast length">
              {HORIZONS.map(h => <TabsTrigger key={h} value={String(h)} className="px-3">{h} days</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Include in forecast">
            {(Object.keys(SOURCE_LABELS) as ForecastSource[])
              .filter(source => source !== 'budget' || hasBudget)
              .map(source => (
                <Button
                  key={source}
                  size="sm"
                  variant={sources[source] ? 'secondary' : 'outline'}
                  aria-pressed={sources[source]}
                  className={cn(!sources[source] && "text-muted-foreground")}
                  onClick={() => setSources(s => ({ ...s, [source]: !s[source] }))}
                >
                  {sources[source] && <CheckIcon />}
                  {SOURCE_LABELS[source]}
                </Button>
              ))}
          </div>
        </div>

        {error ? (
          <Card><ErrorState title="Couldn't build the forecast" error={error} onRetry={() => mutate()} /></Card>
        ) : isLoading || !data || !forecast ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        ) : <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today"
              value={toCurrency(data.startBalance)}
              detail={data.balanceAsOf
                ? `As reported by your bank ${format(new Date(data.balanceAsOf), "MMM d, h:mm a")}`
                : 'As reported by your bank'}
              onExplain={() => setExplaining('today')}
            />
            <StatCard
              label={`In ${days} days`}
              onExplain={() => setExplaining('end')}
              value={toCurrency(forecast.end)}
              tone={forecast.end < 0 ? 'negative' : undefined}
              detail={<span className={change >= 0 ? "text-positive" : "text-negative"}>
                {change >= 0 ? '+' : '−'}{toCurrency(Math.abs(change))} from today
              </span>}
            />
            <StatCard
              label="Lowest point"
              onExplain={() => setExplaining('low')}
              value={toCurrency(forecast.low.balance)}
              tone={forecast.low.balance < 0 ? 'negative' : undefined}
              detail={forecast.low.balance < 0
                ? `Overdrawn on ${format(parseISO(forecast.low.date), 'MMM d')}`
                : `On ${format(parseISO(forecast.low.date), 'MMM d')}`}
            />
            <StatCard
              label="Coming in / going out"
              onExplain={() => setExplaining('flows')}
              value={<span className="text-xl"><span className="text-positive">+{toCurrency(forecast.totalIn)}</span> <span className="text-muted-foreground">/</span> {toCurrency(forecast.totalOut)}</span>}
              detail={`Over the next ${days} days`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projected balance</CardTitle>
              <CardDescription>
                {data.account.name}{data.account.mask ? ` ••${data.account.mask}` : ''} · hover a day to see what&apos;s expected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForecastChart points={forecast.points} low={forecast.low} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>What the forecast expects, day by day.</CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingList
                points={forecast.points}
                lateEvents={lateEvents}
                countLate={countLate}
                onCountLateChange={setCountLate}
                streams={data.streams}
                scheduled={data.scheduled}
                onEditStream={setEditingStream}
                onToggleStreamHidden={(stream, hidden) => saveOverride(
                  { stream_id: stream.streamId, hidden },
                  hidden ? `${stream.name} hidden from the forecast.` : `${stream.name} is back in the forecast.`,
                )}
                onResetStream={(stream) => resetOverride(stream.streamId)}
                onEditScheduled={(item) => setScheduledDialog({ open: true, item })}
                onDeleteScheduled={setDeleting}
              />
            </CardContent>
          </Card>
        </>}

        {data && forecast &&
          <ForecastExplainSheet
            kpi={explaining}
            onOpenChange={(open) => !open && setExplaining(null)}
            data={data}
            forecast={forecast}
            days={days}
            lateCount={countLate ? 0 : lateEvents.length}
          />
        }
        <ScheduledItemDialog
          open={scheduledDialog.open}
          onOpenChange={(open) => setScheduledDialog(s => ({ ...s, open }))}
          accountId={accountId}
          item={scheduledDialog.item}
          onSave={saveScheduled}
        />
        <StreamOverrideDialog
          stream={editingStream}
          onOpenChange={(open) => !open && setEditingStream(null)}
          onSave={(override) => saveOverride(override)}
        />
        <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete {deleting?.name}?</DialogTitle>
              <DialogDescription>It&apos;ll be removed from the forecast. This can&apos;t be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (deleting?._id && await deleteScheduled(String(deleting._id))) setDeleting(null)
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>}
    </div>
  )
}

function ForecastChart({ points, low }: { points: ForecastPoint[], low: { date: string, balance: number } }) {
  const dipsBelowZero = low.balance < 0

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <AreaChart data={points} margin={{ top: 12, left: 4, right: 12 }}>
        <defs>
          <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => format(parseISO(value), 'MMM d')}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={80}
          tickFormatter={(value) => toCurrency(Number(value)).replace(/\.\d\d$/, '')}
        />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ForecastTooltip />} />
        {dipsBelowZero && <ReferenceLine y={0} stroke="var(--negative)" strokeDasharray="4 4" />}
        {/* Balances change on the day a transaction lands, so draw steps. */}
        <Area
          dataKey="balance"
          type="stepAfter"
          stroke="var(--color-balance)"
          strokeWidth={2}
          fill="url(#forecast-fill)"
        />
        <ReferenceDot
          x={low.date}
          y={low.balance}
          r={5}
          fill={dipsBelowZero ? "var(--negative)" : "var(--color-balance)"}
          stroke="var(--card)"
          strokeWidth={2}
          label={{ value: 'Lowest', position: 'top', fontSize: 11, fill: 'var(--muted-foreground)' }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function ForecastTooltip({ active, payload }: { active?: boolean, payload?: { payload: ForecastPoint }[] }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const shown = point.events.slice(0, 5)

  return (
    <div className="grid min-w-52 gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium">{format(parseISO(point.date), 'EEE, MMM d')}</span>
        <span className={cn("font-mono font-medium tabular-nums", point.balance < 0 && "text-negative")}>{toCurrency(point.balance)}</span>
      </div>
      {shown.map((event, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 text-muted-foreground">
          <span className="max-w-40 truncate">{event.name}</span>
          <Amount value={event.amount} className="font-normal" />
        </div>
      ))}
      {point.events.length > shown.length &&
        <div className="text-muted-foreground">+{point.events.length - shown.length} more</div>
      }
    </div>
  )
}

export default ForecastCalendar
