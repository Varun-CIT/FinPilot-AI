'use client'

import { useState } from 'react'
import { Activity, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState, ErrorState, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { assessRisk } from '@/lib/finpilot-service'
import type { RiskAssessmentInput } from '@/lib/finpilot-data'

const numericFields = [
  { key: 'age', label: 'Age', min: 18, max: 110, step: 1 },
  { key: 'monthly_income_inr', label: 'Monthly income (INR)', min: 0, step: 'any' },
  { key: 'income_stability', label: 'Income stability score', min: 1, max: 5, step: 1, description: 'Use the API scale from 1 to 5.' },
  { key: 'monthly_essential_expenses_inr', label: 'Monthly essential expenses (INR)', min: 0, step: 'any' },
  { key: 'monthly_debt_payments_inr', label: 'Monthly debt payments (INR)', min: 0, step: 'any' },
  { key: 'liquid_savings_inr', label: 'Liquid savings (INR)', min: 0, step: 'any' },
  { key: 'dependants', label: 'Dependants', min: 0, max: 30, step: 1 },
  { key: 'goal_horizon_years', label: 'Goal horizon (years)', min: 1, max: 60, step: 1 },
  { key: 'risk_tolerance_score', label: 'Risk tolerance score', min: 0, max: 100, step: 1 },
  { key: 'investment_experience_years', label: 'Investment experience (years)', min: 0, max: 80, step: 1 },
] as const

type RiskFormValues = Record<(typeof numericFields)[number]['key'], string> & {
  recent_high_risk_losses: boolean
  notes: string
}

const emptyForm: RiskFormValues = {
  age: '',
  monthly_income_inr: '',
  income_stability: '',
  monthly_essential_expenses_inr: '',
  monthly_debt_payments_inr: '',
  liquid_savings_inr: '',
  dependants: '',
  goal_horizon_years: '',
  risk_tolerance_score: '',
  investment_experience_years: '',
  recent_high_risk_losses: false,
  notes: '',
}

export function RiskAssessmentPage() {
  const { clients, clientsError, clientsLoading } = useFinPilot()
  const [clientId, setClientId] = useState('')
  const selectedClientId = clients.some((client) => client.id === clientId)
    ? clientId
    : clients[0]?.id ?? ''
  const [form, setForm] = useState<RiskFormValues>(emptyForm)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedClientId) {
      setError('Select a client returned by the API before running an assessment.')
      return
    }
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const input: RiskAssessmentInput = {
        client_id: selectedClientId,
        age: Number(form.age),
        monthly_income_inr: Number(form.monthly_income_inr),
        income_stability: Number(form.income_stability),
        monthly_essential_expenses_inr: Number(form.monthly_essential_expenses_inr),
        monthly_debt_payments_inr: Number(form.monthly_debt_payments_inr),
        liquid_savings_inr: Number(form.liquid_savings_inr),
        dependants: Number(form.dependants),
        goal_horizon_years: Number(form.goal_horizon_years),
        risk_tolerance_score: Number(form.risk_tolerance_score),
        investment_experience_years: Number(form.investment_experience_years),
        recent_high_risk_losses: form.recent_high_risk_losses,
        notes: form.notes.trim() || null,
      }
      setResult(await assessRisk(input))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Risk assessment failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client-level evaluation"
        title="Risk assessment"
        description="The form mirrors the FastAPI ClientProfile schema. Risk scores and classifications are returned only by POST /risk/assess; no frontend scoring is performed."
      />
      {clientsError && <ErrorState message={clientsError.message} />}
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Client financial profile</CardTitle><p className="text-sm text-slate-600">Required numeric ranges follow the uploaded OpenAPI schema.</p></CardHeader>
          <CardContent>
            {clientsLoading ? <p className="py-6 text-sm text-slate-500">Loading clients…</p> : clientsError && clients.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Client list unavailable" description="FastAPI did not return client data. Retry when the backend is reachable." />
            ) : clients.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No client records available" description="Create or load a client profile before requesting a risk assessment." />
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-5">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="risk-client">Client</FieldLabel>
                    <Select value={selectedClientId} onValueChange={(value) => setClientId(value ?? '')}>
                      <SelectTrigger id="risk-client"><SelectValue placeholder="Select a client" /></SelectTrigger>
                      <SelectContent><SelectGroup>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.full_name} · {client.id}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                    <FieldDescription>The client is attached to the request by its API id.</FieldDescription>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {numericFields.map((field) => (
                      <Field key={field.key}>
                        <FieldLabel htmlFor={`risk-${field.key}`}>{field.label}</FieldLabel>
                        <Input
                          id={`risk-${field.key}`}
                          type="number"
                          min={field.min}
                          max={'max' in field ? field.max : undefined}
                          step={field.step}
                          required
                          value={form[field.key]}
                          onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                        />
                        {'description' in field && <FieldDescription>{field.description}</FieldDescription>}
                      </Field>
                    ))}
                  </div>
                  <FieldSet className="rounded-xl border border-border/70 p-4">
                    <FieldLegend variant="label">Recent high-risk losses</FieldLegend>
                    <Field orientation="horizontal" className="items-center">
                      <Input id="risk-recent-losses" type="checkbox" checked={form.recent_high_risk_losses} onChange={(event) => setForm((current) => ({ ...current, recent_high_risk_losses: event.target.checked }))} className="size-4 accent-emerald-700" />
                      <FieldLabel htmlFor="risk-recent-losses">Client reports recent high-risk investment losses</FieldLabel>
                    </Field>
                  </FieldSet>
                  <Field>
                    <FieldLabel htmlFor="risk-notes">Notes</FieldLabel>
                    <Textarea id="risk-notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={2000} rows={3} />
                  </Field>
                </FieldGroup>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={submitting || !selectedClientId}>{submitting ? 'Requesting assessment…' : 'Run risk assessment'}</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base text-navy"><Activity className="size-4 text-emerald-800" />Assessment response</CardTitle><p className="text-sm text-slate-600">Returned fields are rendered without client-side score calculations.</p></CardHeader>
            <CardContent>
              {result ? <RecordFields record={result} /> : <EmptyState icon={ShieldCheck} title="No assessment yet" description="Submit the profile to see the actual response from POST /risk/assess." />}
            </CardContent>
          </Card>
          <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-none">
            <CardHeader><CardTitle className="text-sm text-navy">Adviser control</CardTitle></CardHeader>
            <CardContent className="pt-0 text-sm leading-6 text-slate-700">
              The documented API exposes a calculation endpoint, not a persisted client-risk assessment endpoint. This screen does not claim the response was saved to the client record.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
