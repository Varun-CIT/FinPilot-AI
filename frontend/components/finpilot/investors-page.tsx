'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowUpRight, FileText, Pencil, Plus, Search, Trash2, UserRound, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { EmptyState, ErrorState, PageHeader, RecordFields, SectionHeading } from '@/components/finpilot/shared'
import { getClientGoals } from '@/lib/finpilot-service'
import {
  apiRecordSearchText,
  getClientId,
  getClientName,
  getGoalId,
  type ApiRecord,
  type ClientCreateInput,
  type ClientRecord,
  type ClientUpdateInput,
} from '@/lib/finpilot-data'

const swrOptions = { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false }

type ClientFormValues = {
  full_name: string
  email: string
  phone: string
  age: string
  occupation: string
  annual_income: string
  monthly_expenses: string
  existing_investments: string
  emergency_fund: string
  financial_notes: string
}

function initialClientValues(client?: ClientRecord): ClientFormValues {
  return {
    full_name: client?.full_name ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    age: client?.age == null ? '' : String(client.age),
    occupation: client?.occupation ?? '',
    annual_income: client?.annual_income == null ? '' : String(client.annual_income),
    monthly_expenses: client?.monthly_expenses == null ? '' : String(client.monthly_expenses),
    existing_investments: client?.existing_investments == null ? '' : String(client.existing_investments),
    emergency_fund: client?.emergency_fund == null ? '' : String(client.emergency_fund),
    financial_notes: client?.financial_notes ?? '',
  }
}

function nullableNumber(
  value: string,
  label: string,
  min = 0,
  max?: number,
  exclusiveMin = false,
): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number.`)
  if (parsed < min || (exclusiveMin && parsed === min) || (max !== undefined && parsed > max)) {
    throw new Error(`${label} must be ${exclusiveMin ? `greater than ${min}` : `at least ${min}`}${max === undefined ? '' : ` and no more than ${max}`}.`)
  }
  return parsed
}

function ClientEditorDialog({
  client,
  onOpenChange,
  onSave,
}: {
  client?: ClientRecord
  onOpenChange: (open: boolean) => void
  onSave: (input: ClientCreateInput | ClientUpdateInput, client?: ClientRecord) => Promise<void>
}) {
  const [values, setValues] = useState(() => initialClientValues(client))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key: keyof ClientFormValues, value: string) => setValues((current) => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fullName = values.full_name.trim()
    if (fullName.length < 2 || fullName.length > 100) {
      setError('Full name must be between 2 and 100 characters.')
      return
    }
    if (values.phone.trim().length > 20 || values.occupation.trim().length > 100) {
      setError('Phone must be 20 characters or fewer and occupation must be 100 characters or fewer.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const input: ClientCreateInput = {
        full_name: fullName,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        age: nullableNumber(values.age, 'Age', 0, 120, true),
        occupation: values.occupation.trim() || null,
        annual_income: nullableNumber(values.annual_income, 'Annual income'),
        monthly_expenses: nullableNumber(values.monthly_expenses, 'Monthly expenses'),
        existing_investments: nullableNumber(values.existing_investments, 'Existing investments'),
        emergency_fund: nullableNumber(values.emergency_fund, 'Emergency fund'),
        financial_notes: values.financial_notes.trim() || null,
      }
      await onSave(input, client)
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The client could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit client profile' : 'Add client profile'}</DialogTitle>
          <DialogDescription>Values are sent to the FastAPI client create or update endpoint. No financial defaults are prefilled.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-full-name">Full name</FieldLabel>
              <Input id="client-full-name" value={values.full_name} onChange={(event) => update('full_name', event.target.value)} required minLength={2} maxLength={100} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client-email">Email</FieldLabel>
                <Input id="client-email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-phone">Phone</FieldLabel>
                <Input id="client-phone" type="tel" maxLength={20} value={values.phone} onChange={(event) => update('phone', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-age">Age</FieldLabel>
                <Input id="client-age" type="number" min="0" max="120" step="any" value={values.age} onChange={(event) => update('age', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-occupation">Occupation</FieldLabel>
                <Input id="client-occupation" maxLength={100} value={values.occupation} onChange={(event) => update('occupation', event.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client-annual-income">Annual income</FieldLabel>
                <Input id="client-annual-income" type="number" min="0" step="any" value={values.annual_income} onChange={(event) => update('annual_income', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-monthly-expenses">Monthly expenses</FieldLabel>
                <Input id="client-monthly-expenses" type="number" min="0" step="any" value={values.monthly_expenses} onChange={(event) => update('monthly_expenses', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-existing-investments">Existing investments</FieldLabel>
                <Input id="client-existing-investments" type="number" min="0" step="any" value={values.existing_investments} onChange={(event) => update('existing_investments', event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-emergency-fund">Emergency fund</FieldLabel>
                <Input id="client-emergency-fund" type="number" min="0" step="any" value={values.emergency_fund} onChange={(event) => update('emergency_fund', event.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="client-financial-notes">Financial notes</FieldLabel>
              <Textarea id="client-financial-notes" value={values.financial_notes} onChange={(event) => update('financial_notes', event.target.value)} rows={3} />
              <FieldDescription>Keep notes factual and relevant to the adviser workflow.</FieldDescription>
            </Field>
          </FieldGroup>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : client ? 'Save changes' : 'Create client'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ClientGoals({ clientId }: { clientId: string }) {
  const { data, error, isLoading, mutate } = useSWR<ApiRecord[]>(
    `/clients/${encodeURIComponent(clientId)}/goals`,
    () => getClientGoals(clientId),
    swrOptions,
  )

  if (isLoading) return <p className="py-6 text-sm text-slate-500">Loading goals from FastAPI…</p>
  if (error) return <ErrorState message={error instanceof Error ? error.message : 'Goals could not be loaded.'} onRetry={() => void mutate()} />
  if (!data?.length) return <EmptyState icon={FileText} title="No goals returned" description="The client goals endpoint returned an empty list." />

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.map((goal, index) => {
        const goalId = getGoalId(goal)
        const title = typeof goal.goal_name === 'string' ? goal.goal_name : `Goal ${goalId ?? index + 1}`
        return <Card key={goalId ?? index} className="border-border/80"><CardHeader className="pb-3"><CardTitle className="text-sm text-navy">{title}</CardTitle></CardHeader><CardContent className="pt-0"><RecordFields record={goal} /></CardContent></Card>
      })}
    </div>
  )
}

export function InvestorsPage() {
  const { clients, clientsLoading, clientsError, refreshClients, createClient, updateClient, deleteClient } = useFinPilot()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>()
  const [editorClient, setEditorClient] = useState<ClientRecord | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const selectedClient = clients.find((client) => client.id === selectedId) ?? clients[0]

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return clients
    return clients.filter((client) => apiRecordSearchText(client).includes(normalized))
  }, [clients, search])

  async function saveClient(input: ClientCreateInput | ClientUpdateInput, client?: ClientRecord) {
    setBusy(true)
    try {
      if (client) await updateClient(client.id, input as ClientUpdateInput)
      else await createClient(input as ClientCreateInput)
      toast.success(client ? 'Client profile updated.' : 'Client profile created.')
      setEditorOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!selectedClient) return
    setBusy(true)
    try {
      await deleteClient(selectedClient.id)
      setSelectedId(undefined)
      setDeleteOpen(false)
      toast.success('Client profile deleted.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Client could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client management"
        title="Investor profiles"
        description="Client records come directly from GET /clients. Create, update, and delete actions use the documented FastAPI client endpoints."
        action={<Button onClick={() => { setEditorClient(null); setEditorOpen(true) }}><Plus data-icon="inline-start" />Add client</Button>}
      />

      {clientsError && <ErrorState message={clientsError.message} onRetry={() => void refreshClients()} />}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-navy">Client directory</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{clientsLoading ? 'Loading records…' : clientsError && clients.length === 0 ? 'Unavailable' : `${filteredClients.length} API records`}</p>
              </div>
              <Avatar className="size-9 rounded-xl"><AvatarFallback className="rounded-xl bg-emerald-50 text-emerald-900"><Users className="size-4" /></AvatarFallback></Avatar>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input aria-label="Search client profiles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search returned client fields" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {clientsLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading client records…</p>
            ) : clientsError && clients.length === 0 ? (
              <EmptyState icon={Users} title="Client list unavailable" description="FastAPI did not return client data. Retry when the backend is reachable." />
            ) : filteredClients.length === 0 ? (
              <EmptyState icon={Users} title={search ? 'No matching clients' : 'No clients returned'} description={search ? 'Try a different search term.' : 'The API returned an empty client list. Add a profile to start a workflow.'} />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredClients.map((client) => {
                  const active = selectedClient?.id === client.id
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedId(client.id)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-emerald-300 bg-emerald-50/60' : 'border-border/70 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                    >
                      <Avatar className="size-10 rounded-xl"><AvatarFallback className="rounded-xl bg-navy text-xs font-semibold text-white">{client.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy">{client.full_name}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{client.email ?? 'No email returned'} · {client.id}</span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedClient ? (
          <div className="space-y-5">
            <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-12 rounded-2xl"><AvatarFallback className="rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-950">{selectedClient.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><CardTitle className="truncate text-lg text-navy">{getClientName(selectedClient)}</CardTitle><p className="mt-1 truncate text-xs text-slate-500">Client ID · {getClientId(selectedClient)}</p></div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="icon" aria-label="Edit client profile" onClick={() => { setEditorClient(selectedClient); setEditorOpen(true) }}><Pencil className="size-4" /></Button>
                  <Button variant="outline" size="icon" aria-label="Delete client profile" className="text-rose-700 hover:bg-rose-50" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <SectionHeading title="Profile returned by FastAPI" description="Only fields present in the client response are shown." />
                <RecordFields record={selectedClient} omittedKeys={['id']} />
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div><CardTitle className="text-base text-navy">Financial goals</CardTitle><p className="mt-1 text-sm text-slate-600">Live records from GET /clients/{'{client_id}'}/goals.</p></div>
                <Button nativeButton={false} render={<Link href="/goal-planner" />} variant="outline" size="sm">Open planner <ArrowUpRight data-icon="inline-end" /></Button>
              </CardHeader>
              <CardContent><ClientGoals clientId={selectedClient.id} /></CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState icon={UserRound} title={clientsError && clients.length === 0 ? 'Client details unavailable' : 'Select a client'} description={clientsError && clients.length === 0 ? 'Client details will appear when GET /clients is reachable.' : 'Client details appear here after the API returns at least one record.'} />
        )}
      </div>

      {editorOpen && (
        <ClientEditorDialog
          key={editorClient?.id ?? 'new-client'}
          client={editorClient ?? undefined}
          onOpenChange={(open) => { setEditorOpen(open); if (!open) setEditorClient(null) }}
          onSave={saveClient}
        />
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete client profile?</DialogTitle><DialogDescription>This permanently removes the selected client through DELETE /clients/{'{client_id}'}. This action cannot be undone.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => void confirmDelete()} disabled={busy}>{busy ? 'Deleting…' : 'Delete profile'}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
