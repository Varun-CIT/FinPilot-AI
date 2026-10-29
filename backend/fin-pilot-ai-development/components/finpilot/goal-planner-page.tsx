'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Calculator, Info, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { DemoBadge, formatINR, formatINRCompact, PageHeader } from '@/components/finpilot/shared'

type GoalInputs = {
  type: string
  targetAmount: number
  currentSavings: number
  horizonYears: number
  assumedAnnualReturn: number
}

type ProjectionPoint = {
  year: number
  projected: number
  target: number
}

const initialInputs: GoalInputs = {
  type: 'Retirement',
  targetAmount: 25000000,
  currentSavings: 1800000,
  horizonYears: 18,
  assumedAnnualReturn: 10,
}

const projectionConfig = {
  projected: { label: 'Illustrative value', color: 'var(--chart-1)' },
  target: { label: 'Goal target', color: 'var(--chart-3)' },
} satisfies ChartConfig

function calculateProjection(inputs: GoalInputs) {
  const years = Math.max(1, Math.min(50, inputs.horizonYears))
  const periods = years * 12
  const annualRate = Math.max(0, inputs.assumedAnnualReturn) / 100
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1
  const currentSavings = Math.max(0, inputs.currentSavings)
  const targetAmount = Math.max(0, inputs.targetAmount)
  const currentFutureValue = currentSavings * Math.pow(1 + monthlyRate, periods)
  const remainingTarget = Math.max(0, targetAmount - currentFutureValue)
  const contributionFactor = monthlyRate > 0
    ? (Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate
    : periods
  const monthlyContribution = contributionFactor > 0 ? remainingTarget / contributionFactor : 0
  const points: ProjectionPoint[] = []

  for (let year = 0; year <= years; year += 1) {
    const monthsElapsed = year * 12
    const growthFactor = Math.pow(1 + monthlyRate, monthsElapsed)
    const contributionGrowth = monthlyRate > 0
      ? monthlyContribution * ((growthFactor - 1) / monthlyRate)
      : monthlyContribution * monthsElapsed
    points.push({
      year,
      projected: Math.round(currentSavings * growthFactor + contributionGrowth),
      target: targetAmount,
    })
  }

  return {
    points,
    monthlyContribution: Math.ceil(monthlyContribution),
    investedFromContributions: Math.ceil(monthlyContribution * periods + currentSavings),
    projectedValue: Math.round(currentSavings * Math.pow(1 + monthlyRate, periods) + monthlyContribution * contributionFactor),
    years,
    annualRate,
  }
}

function CurrencyField({
  id,
  label,
  helper,
  value,
  onChange,
}: {
  id: string
  label: string
  helper: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
        <Input
          id={id}
          type="number"
          min={0}
          step={10000}
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
          className="h-9 pl-7 text-xs tabular-nums"
          required
        />
      </div>
      <FieldDescription className="text-[10px]">{helper}</FieldDescription>
    </Field>
  )
}

export function GoalPlannerPage() {
  const [inputs, setInputs] = useState(initialInputs)
  const [submittedInputs, setSubmittedInputs] = useState(initialInputs)
  const projection = useMemo(() => calculateProjection(submittedInputs), [submittedInputs])
  const hasChanges = JSON.stringify(inputs) !== JSON.stringify(submittedInputs)

  const update = (key: keyof GoalInputs, value: string | number) => {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedInputs(inputs)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Illustrative planning workspace"
        title="Goal planner"
        description="Explore one possible contribution path using transparent inputs and a clearly stated return assumption."
        action={<DemoBadge />}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.28fr)]">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-semibold text-navy">Goal assumptions</CardTitle>
            <CardDescription className="mt-1 text-xs">All fields are user-controlled demo inputs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel>Goal type</FieldLabel>
                  <Select value={inputs.type} onValueChange={(value) => value && update('type', value)}>
                    <SelectTrigger className="w-full" aria-label="Goal type">
                      <SelectValue placeholder="Choose a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Retirement">Retirement</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Home Purchase">Home purchase</SelectItem>
                        <SelectItem value="Wealth Creation">Wealth creation</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <CurrencyField
                  id="target-amount"
                  label="Target amount"
                  helper="Future goal value · INR"
                  value={inputs.targetAmount}
                  onChange={(value) => update('targetAmount', value)}
                />
                <CurrencyField
                  id="current-savings"
                  label="Current savings"
                  helper="Amount set aside today · INR"
                  value={inputs.currentSavings}
                  onChange={(value) => update('currentSavings', value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="goal-horizon">Horizon</FieldLabel>
                    <div className="relative">
                      <Input
                        id="goal-horizon"
                        type="number"
                        min={1}
                        max={50}
                        value={inputs.horizonYears}
                        onChange={(event) => update('horizonYears', Math.min(50, Math.max(1, Number(event.target.value))))}
                        className="h-9 pr-14 text-xs tabular-nums"
                        required
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">years</span>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="assumed-return">Assumed return</FieldLabel>
                    <div className="relative">
                      <Input
                        id="assumed-return"
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={inputs.assumedAnnualReturn}
                        onChange={(event) => update('assumedAnnualReturn', Math.min(30, Math.max(0, Number(event.target.value))))}
                        className="h-9 pr-8 text-xs tabular-nums"
                        required
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </Field>
                </div>
                <Button type="submit" className="mt-1 w-full">
                  <Calculator data-icon="inline-start" />
                  {hasChanges ? 'Update projection' : 'Refresh projection'}
                </Button>
              </FieldGroup>
            </form>
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <p className="text-[10px] leading-4 text-slate-600">
                The assumed annual return is an editable illustration, not a forecast. Actual investment outcomes may be lower or negative.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Indicative monthly contribution</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.045em] text-navy">{formatINR(projection.monthlyContribution)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">End-of-month contributions</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Illustrative goal value</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.045em] text-navy">{formatINRCompact(projection.projectedValue)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">At year {projection.years}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground">Contribution assumption</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.045em] text-navy">{formatINRCompact(projection.investedFromContributions)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Starting savings + deposits</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-[15px] font-semibold text-navy">Projected growth</CardTitle>
                <CardDescription className="mt-1 text-xs">{submittedInputs.type} · illustrative scenario only</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-800">
                <TrendingUp aria-hidden="true" className="size-3.5" />
                {submittedInputs.assumedAnnualReturn}% assumed annual return
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px]">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="size-2 rounded-full bg-emerald" /> Illustrative value
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="h-0.5 w-3 rounded bg-amber-500" /> Goal target
                </span>
                {hasChanges && <span className="text-amber-700">Inputs changed · update projection to refresh</span>}
              </div>
              <ChartContainer config={projectionConfig} className="h-[280px] w-full">
                <AreaChart data={projection.points} margin={{ left: 4, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value}y`}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    width={58}
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => formatINRCompact(Number(value))}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatINR(Number(value))}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="var(--color-projected)"
                    fill="var(--color-projected)"
                    fillOpacity={0.1}
                    strokeWidth={2.5}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-target)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                The projection compounds a monthly rate derived from the stated annual assumption and deposits at each month end. Taxes, fees, inflation, volatility, and contribution changes are not modeled.
              </p>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Illustrative projection · returns are not guaranteed</AlertTitle>
            <AlertDescription className="text-[11px] leading-5 text-amber-900">
              This calculator is a mathematical demonstration using user-entered assumptions. It is not a forecast, actual market data, or investment advice. Review assumptions and suitability with the investor before using any plan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
      <p className="text-[10px] leading-4 text-slate-500">Demo planning only · Future values can differ materially from the illustration and may be lower than the starting amount.</p>
    </div>
  )
}
