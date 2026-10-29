'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FileCheck2, ShieldAlert, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { EmptyState, ErrorState, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { checkSuitability, runAdvisoryWorkflow } from '@/lib/finpilot-service'
import {
  firstString,
  isApiRecord,
  type AdvisoryWorkflowInput,
  type ApiRecord,
  type ClientProfile,
  type GuardrailResult,
  type RecommendationDraftInput,
  type SuitabilityInput,
} from '@/lib/finpilot-data'

const numericFields = [
  { key: 'age', label: 'Age', min: 18, max: 110, step: 1 },
  { key: 'monthly_income_inr', label: 'Monthly income (INR)', min: 0, step: 'any' },
  { key: 'income_stability', label: 'Income stability score', min: 1, max: 5, step: 1 },
  { key: 'monthly_essential_expenses_inr', label: 'Monthly essential expenses (INR)', min: 0, step: 'any' },
  { key: 'monthly_debt_payments_inr', label: 'Monthly debt payments (INR)', min: 0, step: 'any' },
  { key: 'liquid_savings_inr', label: 'Liquid savings (INR)', min: 0, step: 'any' },
  { key: 'dependants', label: 'Dependants', min: 0, max: 30, step: 1 },
  { key: 'goal_horizon_years', label: 'Goal horizon (years)', min: 1, max: 60, step: 1 },
  { key: 'risk_tolerance_score', label: 'Risk tolerance score', min: 0, max: 100, step: 1 },
  { key: 'investment_experience_years', label: 'Investment experience (years)', min: 0, max: 80, step: 1 },
] as const

type WorkflowFormValues = Record<(typeof numericFields)[number]['key'], string> & {
  recent_high_risk_losses: boolean
  notes: string
  research_question: string
  requested_product_category: string
  requested_outcome: string
  proposed_equity_allocation_pct: string
  proposed_small_cap_allocation_pct: string
  asks_for_guaranteed_returns: boolean
  asks_for_extreme_fast_returns: boolean
  top_k: string
}

const initialForm: WorkflowFormValues = {
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
  research_question: '',
  requested_product_category: '',
  requested_outcome: '',
  proposed_equity_allocation_pct: '',
  proposed_small_cap_allocation_pct: '',
  asks_for_guaranteed_returns: false,
  asks_for_extreme_fast_returns: false,
  top_k: '3',
}

type WorkflowNumericFieldKey = (typeof numericFields)[number]['key'] | 'top_k'

function numberField(values: WorkflowFormValues, key: WorkflowNumericFieldKey): number {
  const value = Number(values[key])
  if (!Number.isFinite(value)) throw new Error(`Enter a valid ${key.replaceAll('_', ' ')}.`)
  return value
}

function profileFields(values: WorkflowFormValues): Omit<ClientProfile, 'client_id'> {
  return {
    age: numberField(values, 'age'),
    monthly_income_inr: numberField(values, 'monthly_income_inr'),
    income_stability: numberField(values, 'income_stability'),
    monthly_essential_expenses_inr: numberField(values, 'monthly_essential_expenses_inr'),
    monthly_debt_payments_inr: numberField(values, 'monthly_debt_payments_inr'),
    liquid_savings_inr: numberField(values, 'liquid_savings_inr'),
    dependants: numberField(values, 'dependants'),
    goal_horizon_years: numberField(values, 'goal_horizon_years'),
    risk_tolerance_score: numberField(values, 'risk_tolerance_score'),
    investment_experience_years: numberField(values, 'investment_experience_years'),
    recent_high_risk_losses: values.recent_high_risk_losses,
    notes: values.notes.trim() || null,
  }
}

function buildProfile(clientId: string, values: WorkflowFormValues): ClientProfile {
  return { client_id: clientId, ...profileFields(values) }
}

function optionalPercentage(value: string): number | null | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) throw new Error('Allocation percentages must be between 0 and 100.')
  return parsed
}

function workflowInput(values: WorkflowFormValues): AdvisoryWorkflowInput {
  if (values.research_question.trim().length < 3 || values.research_question.length > 500) throw new Error('Research question must be 3–500 characters.')
  if (!values.requested_product_category.trim() || values.requested_product_category.length > 120) throw new Error('Product category is required and must be 120 characters or fewer.')
  const topK = numberField(values, 'top_k')
  if (!Number.isInteger(topK) || topK < 1 || topK > 10) throw new Error('top_k must be an integer from 1 to 10.')
  return {
    ...profileFields(values),
    research_question: values.research_question.trim(),
    requested_product_category: values.requested_product_category.trim(),
    requested_outcome: values.requested_outcome.trim(),
    proposed_equity_allocation_pct: optionalPercentage(values.proposed_equity_allocation_pct),
    proposed_small_cap_allocation_pct: optionalPercentage(values.proposed_small_cap_allocation_pct),
    asks_for_guaranteed_returns: values.asks_for_guaranteed_returns,
    asks_for_extreme_fast_returns: values.asks_for_extreme_fast_returns,
    top_k: topK,
  }
}

function buildDraftInput(result: ApiRecord, clientId: string): RecommendationDraftInput | null {
  const draft = isApiRecord(result.recommendation_draft) ? result.recommendation_draft : null
  const guardrail = draft && isApiRecord(draft.guardrail)
    ? draft.guardrail
    : isApiRecord(result.suitability)
      ? result.suitability
      : null
  const status = guardrail && firstString(guardrail, 'status')
  const allowedStatus = status && ['allow_for_adviser_review', 'needs_more_information', 'blocked_pending_reassessment'].includes(status)
  if (!draft || typeof draft.summary !== 'string' || !guardrail || !allowedStatus) return null

  const draftStatus = firstString(draft, 'status')
  return {
    client_id: firstString(draft, 'client_id') ?? clientId,
    summary: draft.summary,
    supporting_facts: Array.isArray(draft.supporting_facts) ? draft.supporting_facts.filter((item): item is string => typeof item === 'string') : undefined,
    source_citations: Array.isArray(draft.source_citations) ? draft.source_citations.filter(isApiRecord) : undefined,
    guardrail: { ...guardrail, status: status as GuardrailResult['status'] },
    status: draftStatus && ['draft', 'submitted_for_review', 'approved', 'rejected'].includes(draftStatus)
      ? draftStatus as RecommendationDraftInput['status']
      : undefined,
  }
}

export function RecommendationsPage() {
  const { clients, clientsError, clientsLoading, createDraft, sessionDrafts } = useFinPilot()
  const [clientId, setClientId] = useState('')
  const [values, setValues] = useState<WorkflowFormValues>(initialForm)
  const [workflow, setWorkflow] = useState<ApiRecord | null>(null)
  const [suitability, setSuitability] = useState<ApiRecord | null>(null)
  const [error, setError] = useState('')
  const [suitabilityError, setSuitabilityError] = useState('')
  const [running, setRunning] = useState(false)
  const [checkingSuitability, setCheckingSuitability] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)
  const activeClientId = clients.some((client) => client.id === clientId) ? clientId : clients[0]?.id ?? ''
  const draftInput = useMemo(() => workflow && activeClientId ? buildDraftInput(workflow, activeClientId) : null, [workflow, activeClientId])

  function buildRequestData() {
    const profile = buildProfile(activeClientId, values)
    const workflowBody = workflowInput(values)
    return { profile, workflowBody }
  }

  async function submitWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeClientId) return setError('Select a client returned by GET /clients.')
    setRunning(true)
    setError('')
    setWorkflow(null)
    try {
      const { workflowBody } = buildRequestData()
      setWorkflow(await runAdvisoryWorkflow(activeClientId, workflowBody))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Advisory workflow failed.')
    } finally {
      setRunning(false)
    }
  }

  async function runSuitability() {
    if (!activeClientId) return setSuitabilityError('Select a client returned by GET /clients.')
    setCheckingSuitability(true)
    setSuitabilityError('')
    setSuitability(null)
    try {
      const { profile } = buildRequestData()
      const input: SuitabilityInput = {
        client: profile,
        requested_product_category: values.requested_product_category.trim(),
        requested_outcome: values.requested_outcome.trim(),
        proposed_equity_allocation_pct: optionalPercentage(values.proposed_equity_allocation_pct),
        proposed_small_cap_allocation_pct: optionalPercentage(values.proposed_small_cap_allocation_pct),
        asks_for_guaranteed_returns: values.asks_for_guaranteed_returns,
        asks_for_extreme_fast_returns: values.asks_for_extreme_fast_returns,
      }
      setSuitability(await checkSuitability(input))
    } catch (cause) {
      setSuitabilityError(cause instanceof Error ? cause.message : 'Suitability check failed.')
    } finally {
      setCheckingSuitability(false)
    }
  }

  async function saveDraft() {
    if (!draftInput) return
    setCreatingDraft(true)
    try {
      await createDraft(draftInput)
      toast.success('Adviser draft created through FastAPI.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Adviser draft could not be created.')
    } finally {
      setCreatingDraft(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Adviser-led workflow" title="Recommendation workspace" description="Run the documented advisory workflow and suitability guardrails. Every draft requires adviser review; client delivery remains disabled." action={<Button nativeButton={false} render={<Link href="/adviser-review" />} variant="outline">Open review queue <ArrowUpRight data-icon="inline-end" /></Button>} />
      {clientsError && <ErrorState message={clientsError.message} />}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Workflow inputs</CardTitle><p className="text-sm text-slate-600">Fields and ranges mirror AdvisoryWorkflowRequest from the uploaded OpenAPI spec.</p></CardHeader>
          <CardContent>
            {clientsLoading ? <p className="py-5 text-sm text-slate-500">Loading client records…</p> : clientsError && clients.length === 0 ? <EmptyState icon={Sparkles} title="Client list unavailable" description="FastAPI did not return client data. Retry when the backend is reachable." /> : clients.length === 0 ? <EmptyState icon={Sparkles} title="No client records available" description="Create or load a client before running an advisory workflow." /> : (
              <form onSubmit={submitWorkflow} className="flex flex-col gap-5">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="workflow-client">Client</FieldLabel>
                    <Select value={activeClientId} onValueChange={(value) => setClientId(value ?? '')}>
                      <SelectTrigger id="workflow-client"><SelectValue placeholder="Select a client" /></SelectTrigger>
                      <SelectContent><SelectGroup>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.full_name} · {client.id}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {numericFields.map((field) => (
                      <Field key={field.key}>
                        <FieldLabel htmlFor={`workflow-${field.key}`}>{field.label}</FieldLabel>
                        <Input id={`workflow-${field.key}`} type="number" min={field.min} max={'max' in field ? field.max : undefined} step={field.step} required value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                      </Field>
                    ))}
                  </div>
                  <FieldSet className="rounded-xl border border-border/70 p-4">
                    <FieldLegend variant="label">Suitability-related flags</FieldLegend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field orientation="horizontal" className="items-center"><Input id="workflow-recent-losses" type="checkbox" checked={values.recent_high_risk_losses} onChange={(event) => setValues((current) => ({ ...current, recent_high_risk_losses: event.target.checked }))} className="size-4 accent-emerald-700" /><FieldLabel htmlFor="workflow-recent-losses">Recent high-risk losses</FieldLabel></Field>
                      <Field orientation="horizontal" className="items-center"><Input id="workflow-guarantee" type="checkbox" checked={values.asks_for_guaranteed_returns} onChange={(event) => setValues((current) => ({ ...current, asks_for_guaranteed_returns: event.target.checked }))} className="size-4 accent-emerald-700" /><FieldLabel htmlFor="workflow-guarantee">Guaranteed returns requested</FieldLabel></Field>
                      <Field orientation="horizontal" className="items-center"><Input id="workflow-extreme-returns" type="checkbox" checked={values.asks_for_extreme_fast_returns} onChange={(event) => setValues((current) => ({ ...current, asks_for_extreme_fast_returns: event.target.checked }))} className="size-4 accent-emerald-700" /><FieldLabel htmlFor="workflow-extreme-returns">Extreme fast returns requested</FieldLabel></Field>
                    </div>
                  </FieldSet>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field><FieldLabel htmlFor="workflow-question">Research question</FieldLabel><Textarea id="workflow-question" required minLength={3} maxLength={500} rows={3} value={values.research_question} onChange={(event) => setValues((current) => ({ ...current, research_question: event.target.value }))} /></Field>
                    <Field><FieldLabel htmlFor="workflow-product">Requested product category</FieldLabel><Input id="workflow-product" required maxLength={120} value={values.requested_product_category} onChange={(event) => setValues((current) => ({ ...current, requested_product_category: event.target.value }))} /></Field>
                  </div>
                  <Field><FieldLabel htmlFor="workflow-outcome">Requested outcome</FieldLabel><Textarea id="workflow-outcome" maxLength={1000} rows={2} value={values.requested_outcome} onChange={(event) => setValues((current) => ({ ...current, requested_outcome: event.target.value }))} /></Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field><FieldLabel htmlFor="workflow-equity">Proposed equity allocation (%)</FieldLabel><Input id="workflow-equity" type="number" min="0" max="100" step="0.1" value={values.proposed_equity_allocation_pct} onChange={(event) => setValues((current) => ({ ...current, proposed_equity_allocation_pct: event.target.value }))} /></Field>
                    <Field><FieldLabel htmlFor="workflow-small-cap">Proposed small-cap allocation (%)</FieldLabel><Input id="workflow-small-cap" type="number" min="0" max="100" step="0.1" value={values.proposed_small_cap_allocation_pct} onChange={(event) => setValues((current) => ({ ...current, proposed_small_cap_allocation_pct: event.target.value }))} /></Field>
                    <Field><FieldLabel htmlFor="workflow-top-k">Research evidence count</FieldLabel><Input id="workflow-top-k" type="number" min="1" max="10" step="1" value={values.top_k} onChange={(event) => setValues((current) => ({ ...current, top_k: event.target.value }))} /><FieldDescription>API default: 3.</FieldDescription></Field>
                  </div>
                  <Field><FieldLabel htmlFor="workflow-notes">Profile notes</FieldLabel><Textarea id="workflow-notes" maxLength={2000} rows={2} value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} /></Field>
                </FieldGroup>
                {error && <ErrorState message={error} />}
                <div className="flex flex-wrap gap-2"><Button type="submit" disabled={running}>{running ? 'Running workflow…' : 'Run advisory workflow'}</Button><Button type="button" variant="outline" onClick={() => void runSuitability()} disabled={checkingSuitability}>{checkingSuitability ? 'Checking suitability…' : 'Run suitability check'}</Button></div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
            <CardHeader><CardTitle className="text-base text-navy">Integrated workflow response</CardTitle><p className="text-sm text-slate-600">Only fields returned by the API are shown.</p></CardHeader>
            <CardContent className="space-y-4">
              {workflow ? (
                <div className="space-y-4">
                  {firstString(workflow, 'next_action') && <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950"><span className="font-semibold">Next action from API: </span>{firstString(workflow, 'next_action')}</div>}
                  {isApiRecord(workflow.risk_assessment) && <div><h3 className="mb-2 text-sm font-semibold text-navy">Risk assessment</h3><RecordFields record={workflow.risk_assessment} /></div>}
                  {workflow.financial_goals !== undefined && <div><h3 className="mb-2 text-sm font-semibold text-navy">Financial goals</h3>{Array.isArray(workflow.financial_goals) ? workflow.financial_goals.filter(isApiRecord).map((goal, index) => <div key={index} className="mb-2 rounded-xl border border-border/70 p-3"><RecordFields record={goal} /></div>) : isApiRecord(workflow.financial_goals) ? <RecordFields record={workflow.financial_goals} /> : <p className="text-sm text-slate-600">{String(workflow.financial_goals)}</p>}</div>}
                  {isApiRecord(workflow.fund_research) && <div><h3 className="mb-2 text-sm font-semibold text-navy">Fund research</h3><RecordFields record={workflow.fund_research} /></div>}
                  {isApiRecord(workflow.suitability) && <div><h3 className="mb-2 text-sm font-semibold text-navy">Suitability result</h3><RecordFields record={workflow.suitability} /></div>}
                  {isApiRecord(workflow.recommendation_draft) && <div><h3 className="mb-2 text-sm font-semibold text-navy">Recommendation draft</h3><RecordFields record={workflow.recommendation_draft} /></div>}
                  {draftInput && <Button onClick={() => void saveDraft()} disabled={creatingDraft}><FileCheck2 data-icon="inline-start" />{creatingDraft ? 'Creating draft…' : 'Create adviser draft'}</Button>}
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Client delivery remains disabled in this frontend. No orders or external communications are sent.</p>
                </div>
              ) : <EmptyState icon={Sparkles} title="No workflow response" description="Run the integrated workflow to receive actual risk, goal, evidence, suitability, and draft data from FastAPI." />}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
            <CardHeader><CardTitle className="text-base text-navy">Suitability check</CardTitle><p className="text-sm text-slate-600">POST /suitability/check.</p></CardHeader>
            <CardContent>{suitabilityError ? <ErrorState message={suitabilityError} /> : suitability ? <RecordFields record={suitability} /> : <EmptyState icon={ShieldAlert} title="No suitability response" description="Run the suitability check to view API guardrails." />}</CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
            <CardHeader><CardTitle className="text-base text-navy">Adviser drafts in this session</CardTitle><p className="text-sm text-slate-600">The API has no GET draft-list endpoint; these are actual create responses held in memory by this browser.</p></CardHeader>
            <CardContent>
              {sessionDrafts.length === 0 ? <EmptyState icon={FileCheck2} title="No drafts created in this session" description="Create a draft from a workflow response to continue to adviser review." /> : <div className="space-y-2">{sessionDrafts.slice(0, 3).map((item, index) => <div key={`${firstString(item.record, 'draft_id', 'id') ?? index}`} className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"><span className="truncate font-medium text-navy">{firstString(item.record, 'summary') ?? 'Adviser draft'}</span><Badge variant="outline">{item.status.replaceAll('_', ' ')}</Badge></div>)}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
