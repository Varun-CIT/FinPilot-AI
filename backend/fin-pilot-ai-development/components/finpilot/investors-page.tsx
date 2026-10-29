'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarClock,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Target,
  UserRound,
  UserRoundPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import {
  DemoBadge,
  InvestorStatusBadge,
  PageHeader,
  RiskBadge,
} from '@/components/finpilot/shared'
import type { Investor, NewInvestorInput, RiskLevel } from '@/lib/finpilot-data'

const initialForm: NewInvestorInput = {
  name: '',
  email: '',
  age: 35,
  financialGoal: 'Retirement',
  riskCapacity: 'Moderate',
  riskTolerance: 'Moderate',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function AddInvestorDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (investor: Investor) => void
}) {
  const { addInvestor } = useFinPilot()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const investor = await addInvestor(form)
      onCreated(investor)
      setForm(initialForm)
      onOpenChange(false)
      toast.success('Demo investor added', {
        description: 'This fictional profile is available for this session.',
      })
    } catch (error) {
      toast.error('Investor could not be added', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const setRiskLevel = (key: 'riskCapacity' | 'riskTolerance', value: string | null) => {
    if (value) setForm((current) => ({ ...current, [key]: value as RiskLevel }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.03em] text-navy">
            Add investor profile
          </DialogTitle>
          <DialogDescription>
            Create a fictional demo record. It is not stored beyond this session unless a connected API is configured.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="investor-name">Full name</FieldLabel>
                <Input
                  id="investor-name"
                  autoComplete="name"
                  placeholder="e.g. Aditi Sharma"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="investor-age">Age</FieldLabel>
                <Input
                  id="investor-age"
                  type="number"
                  min={18}
                  max={100}
                  value={form.age}
                  onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) }))}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="investor-email">Email</FieldLabel>
              <Input
                id="investor-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.demo"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Primary financial goal</FieldLabel>
              <Select
                value={form.financialGoal}
                onValueChange={(value) => value && setForm((current) => ({ ...current, financialGoal: value }))}
              >
                <SelectTrigger className="w-full" aria-label="Primary financial goal">
                  <SelectValue placeholder="Choose a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Retirement">Retirement</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Home purchase">Home purchase</SelectItem>
                    <SelectItem value="Wealth creation">Wealth creation</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Risk capacity</FieldLabel>
                <Select value={form.riskCapacity} onValueChange={(value) => setRiskLevel('riskCapacity', value)}>
                  <SelectTrigger className="w-full" aria-label="Risk capacity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Risk tolerance</FieldLabel>
                <Select value={form.riskTolerance} onValueChange={(value) => setRiskLevel('riskTolerance', value)}>
                  <SelectTrigger className="w-full" aria-label="Risk tolerance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <FieldDescription>
              Capacity and tolerance are separate demo fields. Neither is an investment recommendation.
            </FieldDescription>
          </FieldGroup>
          <DialogFooter className="mt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <UserRoundPlus data-icon="inline-start" />
              {saving ? 'Adding profile…' : 'Add demo investor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InvestorDetails({ investor }: { investor: Investor }) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-emerald/10 text-sm font-semibold text-emerald-900">
                {initials(investor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold text-navy">{investor.name}</CardTitle>
              <CardDescription className="mt-1 truncate text-[11px]">{investor.id}</CardDescription>
            </div>
          </div>
          <InvestorStatusBadge status={investor.status} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid h-9 w-full grid-cols-2 bg-slate-100/80">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="goals" className="text-xs">Goals & risk</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Mail aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <span className="break-all">{investor.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <UserRound aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                <span>{investor.age} years · {investor.occupation}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                <span>{investor.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <CalendarClock aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                <span>Last updated {investor.lastUpdated}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                render={<Link href="/risk-assessment" />} nativeButton={false}
              >
                <ShieldCheck data-icon="inline-start" /> Assess risk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                render={<Link href="/goal-planner" />} nativeButton={false}
              >
                <Target data-icon="inline-start" /> Plan a goal
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="goals" className="pt-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recorded goals · DEMO</p>
              <div className="flex flex-wrap gap-1.5">
                {investor.financialGoals.map((goal) => (
                  <Badge key={goal} variant="secondary" className="border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3">
                <p className="text-[10px] text-muted-foreground">Risk capacity</p>
                <div className="mt-2"><RiskBadge value={investor.riskCapacity} /></div>
              </div>
              <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3">
                <p className="text-[10px] text-muted-foreground">Risk tolerance</p>
                <div className="mt-2"><RiskBadge value={investor.riskTolerance} /></div>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-[10px] leading-4 text-amber-900">
              These fields are fictional profile entries. A risk label does not determine suitability.
            </p>
          </TabsContent>
        </Tabs>
        <div className="mt-5 border-t border-border/70 pt-3 text-[10px] leading-4 text-slate-500">
          Demo profile · Not an actual investor record
        </div>
      </CardContent>
    </Card>
  )
}

export function InvestorsPage() {
  const { investors } = useFinPilot()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(investors[0]?.id ?? '')
  const [addOpen, setAddOpen] = useState(false)

  const filteredInvestors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return investors.filter((investor) => {
      const matchesQuery =
        !normalizedQuery ||
        [investor.name, investor.email, investor.id, ...investor.financialGoals]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || investor.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [investors, query, statusFilter])

  const selectedInvestor =
    investors.find((investor) => investor.id === selectedId) ?? filteredInvestors[0] ?? investors[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Investor workspace"
        title="Investor profiles"
        description="Search fictional demo records, review goals, and keep risk capacity distinct from stated tolerance."
        action={
          <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-sm">
            <Plus data-icon="inline-start" /> Add investor
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="gap-4 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-[15px] font-semibold text-navy">All investors</CardTitle>
                <CardDescription className="mt-1 text-xs">{investors.length} fictional profiles · session-only demo data</CardDescription>
              </div>
              <DemoBadge />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  aria-label="Search investors"
                  placeholder="Search name, email, goal, or ID…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 pl-9 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
                <SelectTrigger className="h-9 w-full text-xs sm:w-[160px]" aria-label="Filter by investor status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Review due">Review due</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-y bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="px-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Investor</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Age</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Goals</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Risk capacity</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tolerance</TableHead>
                  <TableHead className="pr-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.map((investor) => (
                  <TableRow
                    key={investor.id}
                    className={selectedInvestor?.id === investor.id ? 'bg-emerald/[0.035]' : ''}
                  >
                    <TableCell className="px-5 py-3.5">
                      <button
                        type="button"
                        className="flex min-w-[170px] items-center gap-2.5 text-left"
                        onClick={() => setSelectedId(investor.id)}
                        aria-label={`View ${investor.name} demo profile`}
                      >
                        <Avatar className="size-8 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-700">
                            {initials(investor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-navy">{investor.name}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">{investor.id}</span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-slate-600">{investor.age}</TableCell>
                    <TableCell className="max-w-[160px]">
                      <span className="block truncate text-xs text-slate-600">{investor.financialGoals[0]}</span>
                      {investor.financialGoals.length > 1 && (
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">+{investor.financialGoals.length - 1} more</span>
                      )}
                    </TableCell>
                    <TableCell><RiskBadge value={investor.riskCapacity} /></TableCell>
                    <TableCell><RiskBadge value={investor.riskTolerance} /></TableCell>
                    <TableCell className="pr-5"><InvestorStatusBadge status={investor.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredInvestors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <Search aria-hidden="true" className="size-4" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-navy">No demo profiles found</p>
                        <p className="mt-1 text-xs text-muted-foreground">Try a different search or status filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-[10px] text-muted-foreground">
            <span>Showing {filteredInvestors.length} of {investors.length} demo profiles</span>
            <span>All profile data is fictional</span>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {selectedInvestor ? (
            <InvestorDetails investor={selectedInvestor} />
          ) : (
            <Card className="rounded-2xl border-border/80">
              <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
                <UserRound aria-hidden="true" className="size-7 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-navy">Select a demo profile</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose an investor from the table to see profile details.</p>
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl border-emerald-100 bg-emerald/[0.04] shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              <div>
                <p className="text-xs font-semibold text-navy">Keep risk dimensions separate</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Financial capacity and psychological tolerance are different inputs. A high tolerance rating does not make an investment suitable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] leading-4 text-slate-500">
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
        <span>Investor names, ages, goals, and statuses are illustrative demo records only.</span>
      </div>

      <AddInvestorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(investor) => setSelectedId(investor.id)}
      />
    </div>
  )
}
