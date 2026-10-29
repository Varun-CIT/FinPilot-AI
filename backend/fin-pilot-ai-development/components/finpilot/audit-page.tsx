'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  CirclePlus,
  FilePenLine,
  FileText,
  History,
  MessageSquareText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
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
import { DemoBadge, PageHeader } from '@/components/finpilot/shared'
import type { AuditEntry } from '@/lib/finpilot-data'

const actionIcons: Record<string, typeof History> = {
  'Draft created': FileText,
  'Risk assessment edited': ShieldCheck,
  'Risk assessment updated': ShieldCheck,
  'Evidence attached': FileText,
  'Review approved': Check,
  'Review rejected': X,
  'Changes requested': MessageSquareText,
  'Investor profile created': CirclePlus,
}

function formatAuditTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function auditRecordHref(recordId: string) {
  return recordId.startsWith('PROP-') ? '/adviser-review' : '/investors'
}

function matchesPeriod(entry: AuditEntry, period: string) {
  if (period === 'all') return true
  const timestamp = new Date(entry.timestamp).getTime()
  if (Number.isNaN(timestamp)) return false
  const age = Date.now() - timestamp
  if (period === 'today') return age >= 0 && age < 24 * 60 * 60 * 1000
  return age >= 0 && age < 7 * 24 * 60 * 60 * 1000
}

export function AuditPage() {
  const { auditEntries } = useFinPilot()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const actionOptions = useMemo(
    () => Array.from(new Set(auditEntries.map((entry) => entry.action))).sort(),
    [auditEntries],
  )
  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return [...auditEntries]
      .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
      .filter((entry) => actionFilter === 'all' || entry.action === actionFilter)
      .filter((entry) => matchesPeriod(entry, periodFilter))
      .filter((entry) => {
        if (!normalizedSearch) return true
        return [entry.action, entry.recordId, entry.actor, entry.description]
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      })
  }, [auditEntries, actionFilter, periodFilter, search])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Traceable workflow history"
        title="Audit trail"
        description="Review demo draft, assessment, evidence, and decision events in one searchable timeline."
        action={<DemoBadge />}
      />

      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Workspace events</CardTitle>
              <CardDescription className="mt-1 text-xs">Session actions are added to this fictional log in memory.</CardDescription>
            </div>
            <Badge variant="outline" className="text-[9px]">{filteredEntries.length} events</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_170px]">
            <Field>
              <FieldLabel htmlFor="audit-search" className="sr-only">Search audit trail</FieldLabel>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="audit-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search action, record ID, or detail…"
                  className="h-9 pl-9 text-xs"
                />
              </div>
            </Field>
            <Field>
              <FieldLabel className="sr-only">Filter by action</FieldLabel>
              <Select value={actionFilter} onValueChange={(value) => value && setActionFilter(value)}>
                <SelectTrigger className="h-9 w-full text-xs" aria-label="Filter by action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All actions</SelectItem>
                    {actionOptions.map((action) => <SelectItem key={action} value={action}>{action}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel className="sr-only">Filter by period</FieldLabel>
              <Select value={periodFilter} onValueChange={(value) => value && setPeriodFilter(value)}>
                <SelectTrigger className="h-9 w-full text-xs" aria-label="Filter by period">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {filteredEntries.length > 0 ? (
            <ol className="relative ml-2 flex flex-col border-l border-slate-200 pl-5">
              {filteredEntries.map((entry, index) => {
                const Icon = actionIcons[entry.action] ?? FilePenLine
                const isLast = index === filteredEntries.length - 1
                return (
                  <li key={entry.id} className={`relative pb-6 ${isLast ? 'pb-1' : ''}`}>
                    <div className="absolute -left-[29px] top-0.5 flex size-7 items-center justify-center rounded-full border border-border bg-white text-slate-500 shadow-sm">
                      <Icon aria-hidden="true" className="size-3.5" />
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-white p-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-navy">{entry.action}</p>
                          <Badge variant="secondary" className="text-[8px]">DEMO</Badge>
                        </div>
                        <p className="mt-1.5 text-[10px] leading-5 text-slate-600">{entry.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
                          <span>Actor: {entry.actor}</span>
                          <span>Record:</span>
                          <Button
                            variant="link"
                            size="sm"
                            render={<Link href={auditRecordHref(entry.recordId)} />} nativeButton={false}
                            className="h-auto p-0 text-[9px] font-semibold text-emerald-800"
                          >
                            {entry.recordId}
                          </Button>
                        </div>
                      </div>
                      <time dateTime={entry.timestamp} className="shrink-0 text-[9px] font-medium text-slate-500">
                        {formatAuditTimestamp(entry.timestamp)}
                      </time>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm"><History aria-hidden="true" className="size-5" /></div>
              <p className="mt-3 text-xs font-semibold text-navy">No matching events</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Adjust the search or filters to see more demo activity.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-[10px]"
                onClick={() => { setSearch(''); setActionFilter('all'); setPeriodFilter('all') }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-[10px] leading-4 text-slate-500">DEMO AUDIT TRAIL · This session-only preview is not a compliant or immutable recordkeeping system.</p>
    </div>
  )
}
