'use client'

import { useMemo, useState } from 'react'
import { History, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { EmptyState, ErrorState, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { apiRecordSearchText, firstString } from '@/lib/finpilot-data'

export function AuditPage() {
  const { auditEntries, auditLoading, auditError, refreshAuditLog } = useFinPilot()
  const [search, setSearch] = useState('')
  const normalized = search.trim().toLowerCase()
  const filteredEntries = useMemo(
    () => normalized ? auditEntries.filter((entry) => apiRecordSearchText(entry).includes(normalized)) : auditEntries,
    [auditEntries, normalized],
  )

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Governance and accountability" title="Audit trail" description="Events are loaded only from GET /adviser/audit-log. No local activity is presented as a backend audit record." action={<Button variant="outline" onClick={() => void refreshAuditLog()} disabled={auditLoading}>Refresh</Button>} />
      <Card className="border-emerald-200 bg-emerald-50/50 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>The connected backend uses in-memory storage. Audit records may reset when that service restarts; this page reflects the current API response only.</p></CardContent>
      </Card>
      {auditError && <ErrorState message={auditError.message} onRetry={() => void refreshAuditLog()} />}
      <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><CardTitle className="text-base text-navy">API audit events</CardTitle><p className="mt-1 text-sm text-slate-600">{auditLoading ? 'Loading…' : auditError && auditEntries.length === 0 ? 'Unavailable' : `${filteredEntries.length} returned event${filteredEntries.length === 1 ? '' : 's'}`}</p></div>
            <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input aria-label="Search audit events" placeholder="Search returned fields" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent>
          {auditLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading audit records from FastAPI…</p> : auditError ? null : filteredEntries.length === 0 ? (
            <EmptyState icon={History} title={search ? 'No matching events' : 'No audit events returned'} description={search ? 'Try another query.' : 'The audit endpoint returned an empty list.'} />
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, index) => {
                const action = firstString(entry, 'action', 'event_type', 'event', 'activity') ?? 'Audit event'
                const eventId = firstString(entry, 'id', 'event_id')
                const clientId = firstString(entry, 'client_id')
                const timestamp = firstString(entry, 'created_at', 'timestamp', 'occurred_at')
                const actor = firstString(entry, 'adviser_id', 'actor', 'user_id')
                return (
                  <article key={eventId ?? `${timestamp ?? 'event'}-${index}`} className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><History className="size-4" /></span><h2 className="mr-auto text-sm font-semibold text-navy">{action}</h2><Badge variant="outline">API record</Badge></div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{actor && <span>Adviser {actor}</span>}{clientId && <span>Client {clientId}</span>}{timestamp && <time>{timestamp}</time>}</div>
                    <RecordFields record={entry} omittedKeys={['action', 'event_type', 'event', 'activity']} />
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
