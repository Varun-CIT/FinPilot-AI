'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Activity, Pencil, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { EmptyState, ErrorState, PageHeader, RecordFields, SectionHeading } from '@/components/finpilot/shared'
import { createClientGoal, deleteClientGoal, getClientGoals, getGoalGlidePath, planGoal, updateClientGoal } from '@/lib/finpilot-service'
import { firstNumber, firstString, getGoalId, isApiRecord, type ApiRecord, type FinancialGoalCreate, type FinancialGoalUpdate } from '@/lib/finpilot-data'

const swrOptions = { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false }

type GoalFormState = {
  goal_name: string
  current_goal_cost_inr: string
  years_to_goal: string
  current_goal_savings_inr: string
  monthly_contribution_inr: string
  annual_inflation_assumption: string
  annual_return_assumption: string
}

const blankGoal: GoalFormState = {
  goal_name: '',
  current_goal_cost_inr: '',
  years_to_goal: '',
  current_goal_savings_inr: '',
  monthly_contribution_inr: '',
  annual_inflation_assumption: '',
  annual_return_assumption: '',
}

function optionalGoalNumber(value: string, label: string, max?: number): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || (max !== undefined && parsed > max)) {
    throw new Error(max === undefined ? `${label} must be a non-negative number.` : `${label} must be between 0 and ${max}.`)
  }
  return parsed
}

function makeGoalInput(values: GoalFormState): FinancialGoalCreate {
  const goalName = values.goal_name.trim()
  const cost = Number(values.current_goal_cost_inr)
  const years = Number(values.years_to_goal)
  const savings = Number(values.current_goal_savings_inr)
  if (!goalName || goalName.length > 120 || !Number.isFinite(cost) || cost <= 0 || !Number.isInteger(years) || years < 1 || years > 60 || !Number.isFinite(savings) || savings < 0) {
    throw new Error('Enter a goal name (1–120 characters), positive goal cost, 1–60 years to goal, and non-negative current savings.')
  }
  const input: FinancialGoalCreate = {
    goal_name: goalName,
    current_goal_cost_inr: cost,
    years_to_goal: years,
    current_goal_savings_inr: savings,
  }
  const monthlyContribution = optionalGoalNumber(values.monthly_contribution_inr, 'Monthly contribution')
  const inflationAssumption = optionalGoalNumber(values.annual_inflation_assumption, 'Annual inflation assumption', 0.2)
  const returnAssumption = optionalGoalNumber(values.annual_return_assumption, 'Annual return assumption', 0.3)
  if (monthlyContribution !== undefined) input.monthly_contribution_inr = monthlyContribution
  if (inflationAssumption !== undefined) input.annual_inflation_assumption = inflationAssumption
  if (returnAssumption !== undefined) input.annual_return_assumption = returnAssumption
  return input
}

function goalFormFromRecord(record: ApiRecord): GoalFormState {
  return {
    goal_name: typeof record.goal_name === 'string' ? record.goal_name : '',
    current_goal_cost_inr: record.current_goal_cost_inr == null ? '' : String(record.current_goal_cost_inr),
    years_to_goal: record.years_to_goal == null ? '' : String(record.years_to_goal),
    current_goal_savings_inr: record.current_goal_savings_inr == null ? '' : String(record.current_goal_savings_inr),
    monthly_contribution_inr: record.monthly_contribution_inr == null ? '' : String(record.monthly_contribution_inr),
    annual_inflation_assumption: record.annual_inflation_assumption == null ? '' : String(record.annual_inflation_assumption),
    annual_return_assumption: record.annual_return_assumption == null ? '' : String(record.annual_return_assumption),
  }
}

function goalUpdateFromValues(values: GoalFormState): FinancialGoalUpdate {
  const goalName = values.goal_name.trim()
  const cost = Number(values.current_goal_cost_inr)
  const years = Number(values.years_to_goal)
  const savings = Number(values.current_goal_savings_inr)
  if (!goalName || goalName.length > 120 || !Number.isFinite(cost) || cost <= 0 || !Number.isInteger(years) || years < 1 || years > 60 || !Number.isFinite(savings) || savings < 0) {
    throw new Error('Enter a valid goal name, positive goal cost, 1–60 years to goal, and non-negative current savings.')
  }
  return {
    goal_name: goalName,
    current_goal_cost_inr: cost,
    years_to_goal: years,
    current_goal_savings_inr: savings,
    monthly_contribution_inr: optionalGoalNumber(values.monthly_contribution_inr, 'Monthly contribution') ?? null,
  }
}

function GoalEditDialog({
  clientId,
  goal,
  onOpenChange,
  onUpdated,
}: {
  clientId: string
  goal: ApiRecord
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  const [values, setValues] = useState(() => goalFormFromRecord(goal))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const goalId = getGoalId(goal)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!goalId) return setError('The API response did not include a goal id.')
    setSaving(true)
    setError('')
    try {
      await updateClientGoal(clientId, goalId, goalUpdateFromValues(values))
      onUpdated()
      onOpenChange(false)
      toast.success('Goal updated.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Update financial goal</DialogTitle><DialogDescription>Edits are sent to PATCH /clients/{'{client_id}'}/goals/{'{goal_id}'}.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field><FieldLabel htmlFor="edit-goal-name">Goal name</FieldLabel><Input id="edit-goal-name" required minLength={1} maxLength={120} value={values.goal_name} onChange={(event) => setValues((current) => ({ ...current, goal_name: event.target.value }))} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="edit-goal-cost">Current goal cost (INR)</FieldLabel><Input id="edit-goal-cost" type="number" min="0.01" step="any" required value={values.current_goal_cost_inr} onChange={(event) => setValues((current) => ({ ...current, current_goal_cost_inr: event.target.value }))} /></Field>
              <Field><FieldLabel htmlFor="edit-goal-years">Years to goal</FieldLabel><Input id="edit-goal-years" type="number" min="1" max="60" step="1" required value={values.years_to_goal} onChange={(event) => setValues((current) => ({ ...current, years_to_goal: event.target.value }))} /></Field>
              <Field><FieldLabel htmlFor="edit-goal-savings">Current goal savings (INR)</FieldLabel><Input id="edit-goal-savings" type="number" min="0" step="any" required value={values.current_goal_savings_inr} onChange={(event) => setValues((current) => ({ ...current, current_goal_savings_inr: event.target.value }))} /></Field>
              <Field><FieldLabel htmlFor="edit-goal-contribution">Monthly contribution (INR)</FieldLabel><Input id="edit-goal-contribution" type="number" min="0" step="any" value={values.monthly_contribution_inr} onChange={(event) => setValues((current) => ({ ...current, monthly_contribution_inr: event.target.value }))} /></Field>
            </div>
          </FieldGroup>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save goal'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function extractGlidePathPoints(value: unknown): Array<{ year: number; equity: number }> {
  const candidates = Array.isArray(value)
    ? value
    : isApiRecord(value)
      ? [value.points, value.glide_path, value.path, value.data].find(Array.isArray) ?? []
      : []
  return candidates.flatMap((item) => {
    if (!isApiRecord(item)) return []
    const year = firstNumber(item, 'year', 'year_index', 'years_to_goal')
    const equity = firstNumber(item, 'equity_pct', 'equity_allocation_pct', 'equity_allocation')
    return year === undefined || equity === undefined ? [] : [{ year, equity }]
  })
}

export function GoalPlannerPage() {
  const { clients, clientsError, clientsLoading, saveClientGoal, deleteGoal } = useFinPilot()
  const [selectedClientId, setSelectedClientId] = useState('')
  const [form, setForm] = useState<GoalFormState>(blankGoal)
  const [goalPlan, setGoalPlan] = useState<ApiRecord | null>(null)
  const [planInput, setPlanInput] = useState<FinancialGoalCreate | null>(null)
  const [planError, setPlanError] = useState('')
  const [planning, setPlanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [glideForm, setGlideForm] = useState({ start_equity_pct: '', years_to_goal: '' })
  const [glidePath, setGlidePath] = useState<unknown>(null)
  const [glideError, setGlideError] = useState('')
  const [loadingGlidePath, setLoadingGlidePath] = useState(false)
  const [editingGoal, setEditingGoal] = useState<ApiRecord | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<ApiRecord | null>(null)

  const activeClientId = clients.some((client) => client.id === selectedClientId) ? selectedClientId : clients[0]?.id ?? ''
  const goalsQuery = useSWR<ApiRecord[]>(activeClientId ? `/clients/${encodeURIComponent(activeClientId)}/goals` : null, () => getClientGoals(activeClientId), swrOptions)
  const glidePoints = extractGlidePathPoints(glidePath)

  async function submitPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPlanning(true)
    setPlanError('')
    try {
      const input = makeGoalInput(form)
      setPlanInput(input)
      setGoalPlan(await planGoal(input))
    } catch (cause) {
      setPlanError(cause instanceof Error ? cause.message : 'Goal planning failed.')
    } finally {
      setPlanning(false)
    }
  }

  async function saveGoal() {
    if (!activeClientId || !planInput) return
    setSaving(true)
    setPlanError('')
    try {
      await saveClientGoal(activeClientId, planInput)
      await goalsQuery.mutate()
      toast.success('Goal saved to the selected client profile.')
    } catch (cause) {
      setPlanError(cause instanceof Error ? cause.message : 'Goal could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function loadGlidePath(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const startEquity = Number(glideForm.start_equity_pct)
    const years = Number(glideForm.years_to_goal)
    if (!Number.isFinite(startEquity) || startEquity < 0 || startEquity > 100 || !Number.isInteger(years) || years < 1 || years > 60) {
      setGlideError('Enter a start equity percentage from 0 to 100 and a 1–60 year horizon.')
      return
    }
    setLoadingGlidePath(true)
    setGlideError('')
    try {
      setGlidePath(await getGoalGlidePath({ start_equity_pct: startEquity, years_to_goal: years }))
    } catch (cause) {
      setGlideError(cause instanceof Error ? cause.message : 'Glide path could not be loaded.')
    } finally {
      setLoadingGlidePath(false)
    }
  }

  async function confirmDeleteGoal() {
    if (!activeClientId || !deletingGoal) return
    const goalId = getGoalId(deletingGoal)
    if (!goalId) return toast.error('The API response did not include a goal id.')
    try {
      await deleteGoal(activeClientId, goalId)
      await goalsQuery.mutate()
      setDeletingGoal(null)
      toast.success('Goal deleted.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Goal could not be deleted.')
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Client goal planning" title="Goal planner" description="Plans, saved goals, and glide paths are returned by FastAPI. The interface does not project returns or calculate a client outcome locally." />
      {clientsError && <ErrorState message={clientsError.message} />}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Plan a financial goal</CardTitle><p className="text-sm text-slate-600">Request fields match FinancialGoalCreate.</p></CardHeader>
          <CardContent>
            <form onSubmit={submitPlan} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="goal-client">Save to client</FieldLabel>
                  <Select value={activeClientId} onValueChange={(value) => setSelectedClientId(value ?? '')}>
                    <SelectTrigger id="goal-client"><SelectValue placeholder={clientsLoading ? 'Loading clients…' : 'Select a client'} /></SelectTrigger>
                    <SelectContent><SelectGroup>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.full_name} · {client.id}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                  <FieldDescription>Goal planning is stateless until saved through the client goals endpoint.</FieldDescription>
                </Field>
                <Field><FieldLabel htmlFor="goal-name">Goal name</FieldLabel><Input id="goal-name" required minLength={1} maxLength={120} value={form.goal_name} onChange={(event) => setForm((current) => ({ ...current, goal_name: event.target.value }))} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor="goal-cost">Current goal cost (INR)</FieldLabel><Input id="goal-cost" type="number" min="0.01" step="any" required value={form.current_goal_cost_inr} onChange={(event) => setForm((current) => ({ ...current, current_goal_cost_inr: event.target.value }))} /></Field>
                  <Field><FieldLabel htmlFor="goal-years">Years to goal</FieldLabel><Input id="goal-years" type="number" min="1" max="60" step="1" required value={form.years_to_goal} onChange={(event) => setForm((current) => ({ ...current, years_to_goal: event.target.value }))} /></Field>
                  <Field><FieldLabel htmlFor="goal-savings">Current goal savings (INR)</FieldLabel><Input id="goal-savings" type="number" min="0" step="any" required value={form.current_goal_savings_inr} onChange={(event) => setForm((current) => ({ ...current, current_goal_savings_inr: event.target.value }))} /></Field>
                  <Field><FieldLabel htmlFor="goal-monthly">Monthly contribution (INR)</FieldLabel><Input id="goal-monthly" type="number" min="0" step="any" value={form.monthly_contribution_inr} onChange={(event) => setForm((current) => ({ ...current, monthly_contribution_inr: event.target.value }))} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor="goal-inflation">Annual inflation assumption</FieldLabel><Input id="goal-inflation" type="number" min="0" max="0.2" step="any" value={form.annual_inflation_assumption} onChange={(event) => setForm((current) => ({ ...current, annual_inflation_assumption: event.target.value }))} /><FieldDescription>Decimal from 0 to 0.20; blank uses the backend default of 0.06.</FieldDescription></Field>
                  <Field><FieldLabel htmlFor="goal-return">Annual return assumption</FieldLabel><Input id="goal-return" type="number" min="0" max="0.3" step="any" value={form.annual_return_assumption} onChange={(event) => setForm((current) => ({ ...current, annual_return_assumption: event.target.value }))} /><FieldDescription>Decimal from 0 to 0.30; blank uses the backend default of 0.08. Assumptions are not guarantees.</FieldDescription></Field>
                </div>
              </FieldGroup>
              {planError && <p role="alert" className="text-sm text-destructive">{planError}</p>}
              <div className="flex flex-wrap gap-2"><Button type="submit" disabled={planning}>{planning ? 'Requesting plan…' : 'Calculate with FastAPI'}</Button><Button type="button" variant="outline" onClick={() => void saveGoal()} disabled={!goalPlan || !activeClientId || saving}>{saving ? 'Saving…' : 'Save to client'}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Plan response</CardTitle><p className="text-sm text-slate-600">POST /goals/plan response. Values are not recomputed in the browser.</p></CardHeader>
          <CardContent>{goalPlan ? <RecordFields record={goalPlan} /> : <EmptyState icon={Target} title="No plan response yet" description="Enter a client goal and request the backend plan." />}</CardContent>
        </Card>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Equity glide path</CardTitle><p className="text-sm text-slate-600">GET /goals/glide-path with adviser-supplied parameters.</p></CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={loadGlidePath} className="flex flex-col gap-4">
              <FieldGroup className="sm:flex-row">
                <Field><FieldLabel htmlFor="glide-equity">Starting equity (%)</FieldLabel><Input id="glide-equity" type="number" min="0" max="100" step="0.1" required value={glideForm.start_equity_pct} onChange={(event) => setGlideForm((current) => ({ ...current, start_equity_pct: event.target.value }))} /></Field>
                <Field><FieldLabel htmlFor="glide-years">Years to goal</FieldLabel><Input id="glide-years" type="number" min="1" max="60" step="1" required value={glideForm.years_to_goal} onChange={(event) => setGlideForm((current) => ({ ...current, years_to_goal: event.target.value }))} /></Field>
              </FieldGroup>
              {glideError && <p role="alert" className="text-sm text-destructive">{glideError}</p>}
              <Button type="submit" variant="outline" disabled={loadingGlidePath}>{loadingGlidePath ? 'Loading glide path…' : 'Load glide path'}</Button>
            </form>
            {glidePath && glidePoints.length > 0 ? (
              <ChartContainer config={{ equity: { label: 'Equity allocation', color: 'var(--chart-1)' } }} className="h-64 w-full">
                <LineChart data={glidePoints} margin={{ top: 10, right: 12, bottom: 2, left: -12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={42} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="equity" stroke="var(--color-equity)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : glidePath ? (
              isApiRecord(glidePath) ? <RecordFields record={glidePath} /> : <pre className="max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(glidePath, null, 2)}</pre>
            ) : <EmptyState icon={Activity} title="No glide path loaded" description="The chart appears only when the API returns recognizable year and equity-allocation points." />}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Saved goals</CardTitle><p className="text-sm text-slate-600">Client-specific records from the documented goals endpoints.</p></CardHeader>
          <CardContent>
            {!activeClientId ? <EmptyState icon={Target} title="Select a client" description="Choose a client to load saved goals." /> : goalsQuery.error ? <ErrorState message={goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Goals could not be loaded.'} onRetry={() => void goalsQuery.mutate()} /> : goalsQuery.isLoading ? <p className="py-6 text-sm text-slate-500">Loading saved goals…</p> : !goalsQuery.data?.length ? <EmptyState icon={Target} title="No saved goals returned" description="The client goals endpoint returned an empty list." /> : (
              <div className="space-y-3">
                {goalsQuery.data.map((goal, index) => {
                  const id = getGoalId(goal)
                  const name = firstString(goal, 'goal_name') ?? `Goal ${id ?? index + 1}`
                  return (
                    <div key={id ?? index} className="rounded-xl border border-border/70 bg-white p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div><p className="text-sm font-semibold text-navy">{name}</p><p className="mt-1 text-xs text-slate-500">{id ? `Goal ID · ${id}` : 'Goal id not returned'}</p></div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" aria-label={`Edit ${name}`} disabled={!id} onClick={() => setEditingGoal(goal)}><Pencil className="size-4" /></Button>
                          <Button variant="outline" size="icon" aria-label={`Delete ${name}`} className="text-rose-700 hover:bg-rose-50" disabled={!id} onClick={() => setDeletingGoal(goal)}><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                      <RecordFields record={goal} omittedKeys={['goal_name']} />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {editingGoal && activeClientId && <GoalEditDialog key={getGoalId(editingGoal)} clientId={activeClientId} goal={editingGoal} onOpenChange={(open) => { if (!open) setEditingGoal(null) }} onUpdated={() => void goalsQuery.mutate()} />}
      <Dialog open={!!deletingGoal} onOpenChange={(open) => { if (!open) setDeletingGoal(null) }}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Delete saved goal?</DialogTitle><DialogDescription>This calls the documented DELETE client-goal endpoint.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeletingGoal(null)}>Cancel</Button><Button variant="destructive" onClick={() => void confirmDeleteGoal()}>Delete goal</Button></div></DialogContent>
      </Dialog>
    </div>
  )
}
