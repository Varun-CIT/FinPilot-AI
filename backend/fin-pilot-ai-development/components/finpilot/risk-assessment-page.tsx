'use client'

import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Save,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { DemoBadge, PageHeader, RiskBadge } from '@/components/finpilot/shared'
import type { Investor, RiskAssessmentSnapshot, RiskLevel } from '@/lib/finpilot-data'

const questions = [
  'How would a temporary decline in your investments affect your comfort?',
  'How likely are you to stay invested during a period of uncertainty?',
  'How familiar are you with investment risk and volatility?',
  'How important is avoiding short-term fluctuations to you?',
]

type RiskFormValues = {
  monthlyIncome: number
  monthlyExpenses: number
  assets: number
  liabilities: number
  emergencySavings: number
  horizonYears: number
  questionnaire: number[]
}

const initialValues: RiskFormValues = {
  monthlyIncome: 280000,
  monthlyExpenses: 165000,
  assets: 7200000,
  liabilities: 1400000,
  emergencySavings: 960000,
  horizonYears: 15,
  questionnaire: [3, 4, 3, 3],
}

const levelRank: Record<RiskLevel, number> = { Low: 1, Moderate: 2, High: 3 }

function deriveRiskCapacity(values: RiskFormValues): RiskLevel {
  const income = Math.max(0, values.monthlyIncome)
  const expenses = Math.max(0, values.monthlyExpenses)
  const monthlySurplusRatio = income > 0 ? (income - expenses) / income : 0
  const netAssets = Math.max(0, values.assets - values.liabilities)
  const annualIncome = income * 12
  const emergencyMonths = expenses > 0 ? values.emergencySavings / expenses : 0
  let score = 0

  if (values.horizonYears >= 10) score += 1
  if (values.horizonYears >= 15) score += 1
  if (monthlySurplusRatio >= 0.15) score += 1
  if (monthlySurplusRatio >= 0.3) score += 1
  if (emergencyMonths >= 3) score += 1
  if (emergencyMonths >= 6) score += 1
  if (annualIncome > 0 && netAssets >= annualIncome * 3) score += 1

  if (score >= 5) return 'High'
  if (score >= 3) return 'Moderate'
  return 'Low'
}

function deriveRiskTolerance(responses: number[]): RiskLevel {
  const average = responses.reduce((total, answer) => total + answer, 0) / Math.max(responses.length, 1)
  if (average < 2.5) return 'Low'
  if (average < 4) return 'Moderate'
  return 'High'
}

function FieldNumber({
  id,
  label,
  value,
  onChange,
  helper,
  min = 0,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  helper: string
  min?: number
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
        <Input
          id={id}
          type="number"
          min={min}
          step="1000"
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

function RiskAssessmentForm({ investor }: { investor: Investor }) {
  const { saveRiskAssessment } = useFinPilot()
  const [values, setValues] = useState(initialValues)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const riskCapacity = deriveRiskCapacity(values)
  const riskTolerance = deriveRiskTolerance(values.questionnaire)
  const capacityScore = Math.min(100, Math.round((
    (values.horizonYears >= 15 ? 2 : values.horizonYears >= 10 ? 1 : 0) +
    (values.monthlyIncome > 0 && (values.monthlyIncome - values.monthlyExpenses) / values.monthlyIncome >= 0.3 ? 2 : values.monthlyIncome > 0 && (values.monthlyIncome - values.monthlyExpenses) / values.monthlyIncome >= 0.15 ? 1 : 0) +
    (values.monthlyExpenses > 0 && values.emergencySavings / values.monthlyExpenses >= 6 ? 2 : values.monthlyExpenses > 0 && values.emergencySavings / values.monthlyExpenses >= 3 ? 1 : 0) +
    (values.monthlyIncome > 0 && Math.max(0, values.assets - values.liabilities) >= values.monthlyIncome * 36 ? 1 : 0)
  ) / 7 * 100))
  const toleranceScore = Math.round(
    (values.questionnaire.reduce((total, answer) => total + answer, 0) / values.questionnaire.length / 5) * 100,
  )
  const isConflict = levelRank[riskTolerance] > levelRank[riskCapacity]
  const isConservativePreference = levelRank[riskTolerance] < levelRank[riskCapacity]

  const updateValue = (key: keyof Omit<RiskFormValues, 'questionnaire'>, value: number) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const updateAnswer = (index: number, value: number) => {
    setValues((current) => ({
      ...current,
      questionnaire: current.questionnaire.map((answer, answerIndex) =>
        answerIndex === index ? value : answer,
      ),
    }))
    setSaved(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    const snapshot: RiskAssessmentSnapshot = {
      ...values,
      riskCapacity,
      riskTolerance,
    }
    try {
      await saveRiskAssessment(investor.id, snapshot)
      setSaved(true)
      toast.success('Demo assessment saved', {
        description: 'The separate risk fields were updated for this session.',
      })
    } catch (error) {
      toast.error('Assessment could not be saved', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(330px,0.88fr)]">
      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Financial information</CardTitle>
              <CardDescription className="mt-1 text-xs">Enter the fictional profile inputs used in this illustration.</CardDescription>
            </div>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2">
              <UserRoundCheck aria-hidden="true" className="size-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-navy">{investor.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{investor.id} · DEMO PROFILE</p>
              </div>
            </div>
          </div>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldNumber
                id="monthly-income"
                label="Monthly income"
                value={values.monthlyIncome}
                onChange={(value) => updateValue('monthlyIncome', value)}
                helper="Before tax · INR per month"
              />
              <FieldNumber
                id="monthly-expenses"
                label="Monthly expenses"
                value={values.monthlyExpenses}
                onChange={(value) => updateValue('monthlyExpenses', value)}
                helper="Essential and recurring · INR per month"
              />
              <FieldNumber
                id="assets"
                label="Assets"
                value={values.assets}
                onChange={(value) => updateValue('assets', value)}
                helper="Declared assets · INR"
              />
              <FieldNumber
                id="liabilities"
                label="Liabilities"
                value={values.liabilities}
                onChange={(value) => updateValue('liabilities', value)}
                helper="Outstanding obligations · INR"
              />
              <FieldNumber
                id="emergency-savings"
                label="Emergency savings"
                value={values.emergencySavings}
                onChange={(value) => updateValue('emergencySavings', value)}
                helper="Liquid reserve · INR"
              />
              <Field>
                <FieldLabel htmlFor="horizon-years">Investment horizon</FieldLabel>
                <div className="relative">
                  <Input
                    id="horizon-years"
                    type="number"
                    min={1}
                    max={60}
                    value={values.horizonYears}
                    onChange={(event) => updateValue('horizonYears', Math.min(60, Math.max(1, Number(event.target.value))))}
                    className="h-9 pr-14 text-xs tabular-nums"
                    required
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">years</span>
                </div>
                <FieldDescription className="text-[10px]">Time to the selected goal</FieldDescription>
              </Field>
            </div>
          </FieldGroup>

          <div className="border-t border-border/70 pt-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-navy">Risk tolerance questionnaire</h3>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Self-reported preference; it does not measure financial capacity.</p>
            </div>
            <FieldGroup className="gap-4">
              {questions.map((question, index) => (
                <Field key={question}>
                  <div className="flex items-start justify-between gap-3">
                    <FieldLabel htmlFor={`tolerance-${index}`} className="max-w-[85%] text-xs leading-5">
                      {question}
                    </FieldLabel>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold tabular-nums text-slate-700">
                      {values.questionnaire[index]} / 5
                    </span>
                  </div>
                  <input
                    id={`tolerance-${index}`}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={values.questionnaire[index]}
                    aria-valuetext={`${values.questionnaire[index]} out of 5`}
                    onChange={(event) => updateAnswer(index, Number(event.target.value))}
                    className="mt-1 h-2 w-full cursor-pointer accent-emerald"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Prefer stability</span>
                    <span>Comfortable with fluctuation</span>
                  </div>
                </Field>
              ))}
            </FieldGroup>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-fit">
            {saved ? <CheckCircle2 data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            {saving ? 'Saving assessment…' : saved ? 'Assessment saved for this session' : 'Save demo assessment'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-navy">Assessment indicators</CardTitle>
            <CardDescription className="mt-1 text-xs">Two distinct dimensions, shown independently</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl border border-border/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-navy">Risk capacity</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Financial ability to absorb uncertainty</p>
                </div>
                <RiskBadge value={riskCapacity} />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`Illustrative capacity indicator ${capacityScore} percent`}>
                <div className="h-full rounded-full bg-emerald transition-[width]" style={{ width: `${capacityScore}%` }} />
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Derived from surplus, emergency reserves, net assets, and horizon in this demo logic.</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-navy">Risk tolerance</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Stated comfort with fluctuation</p>
                </div>
                <RiskBadge value={riskTolerance} />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`Illustrative tolerance indicator ${toleranceScore} percent`}>
                <div className="h-full rounded-full bg-slate-500 transition-[width]" style={{ width: `${toleranceScore}%` }} />
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Based only on the fictional questionnaire responses entered above.</p>
            </div>
          </CardContent>
        </Card>

        {isConflict ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Potential capacity / tolerance mismatch</AlertTitle>
            <AlertDescription className="text-[11px] leading-5 text-amber-900">
              Stated tolerance is higher than the capacity indicated by these inputs. A higher tolerance does not increase financial capacity or establish suitability. Reconcile the difference with the investor before any recommendation.
            </AlertDescription>
          </Alert>
        ) : isConservativePreference ? (
          <Alert className="border-sky-200 bg-sky-50 text-sky-950">
            <Info aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Preference is more conservative</AlertTitle>
            <AlertDescription className="text-[11px] leading-5 text-sky-900">
              The self-reported tolerance is lower than the illustrative capacity indicator. Capacity does not obligate an investor to take more risk.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-slate-200 bg-white text-navy">
            <ShieldCheck aria-hidden="true" />
            <AlertTitle className="text-xs font-semibold">Continue with a full suitability review</AlertTitle>
            <AlertDescription className="text-[11px] leading-5">
              Similar demo bands are not a suitability finding. Confirm goals, liquidity needs, experience, constraints, and all applicable adviser obligations.
            </AlertDescription>
          </Alert>
        )}

        <Card className="rounded-2xl border-slate-200 bg-slate-50/70 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-navy">How to read these indicators</p>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                  This transparent, simplified demo logic is not a validated risk model. It must not be used to determine a real client&apos;s risk profile or recommend an investment.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-slate-500">
              Capacity <ArrowRight aria-hidden="true" className="size-3" /> tolerance <span className="ml-1">are not interchangeable</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

export function RiskAssessmentPage() {
  const { investors } = useFinPilot()
  const [selectedId, setSelectedId] = useState(investors[0]?.id ?? '')
  const investor = investors.find((record) => record.id === selectedId) ?? investors[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Investor suitability workflow"
        title="Risk assessment"
        description="Explore financial capacity and psychological risk tolerance as separate, explainable inputs."
        action={<DemoBadge />}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-xs font-semibold text-navy">Selected demo investor</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Assessment changes update the profile for this browser session only.</p>
        </div>
        <Select value={investor?.id ?? ''} onValueChange={(value) => value && setSelectedId(value)}>
          <SelectTrigger className="w-full sm:w-[260px]" aria-label="Choose demo investor">
            <SelectValue placeholder="Select an investor" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {investors.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name} · {item.id}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {investor ? (
        <RiskAssessmentForm key={investor.id} investor={investor} />
      ) : (
        <Card className="rounded-2xl border-border/80">
          <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
            <ShieldCheck aria-hidden="true" className="size-7 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-navy">No demo investors available</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a fictional investor profile to begin this walkthrough.</p>
          </CardContent>
        </Card>
      )}
      <p className="text-[10px] leading-4 text-slate-500">Demo data only · This illustrative assessment is not a recommendation, verified risk score, or substitute for adviser judgement.</p>
    </div>
  )
}
