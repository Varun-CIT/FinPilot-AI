'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FileCheck2,
  FileSearch,
  History,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState, MetricCard, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { firstString, formatApiValue, isApiRecord } from '@/lib/finpilot-data'

function valueOrUnavailable(value: number, loading: boolean, error?: Error) {
  if (loading) return 'Loading'
  if (error) return 'Unavailable'
  return String(value)
}

export function DashboardPage() {
  const {
    apiStatus,
    healthError,
    clients,
    clientsLoading,
    clientsError,
    auditEntries,
    auditLoading,
    auditError,
    researchStatus,
    researchStatusLoading,
    researchStatusError,
    sessionDrafts,
    refreshClients,
    refreshAuditLog,
  } = useFinPilot()

  const researchRecord = isApiRecord(researchStatus) ? researchStatus : null
  const researchState = researchRecord
    ? firstString(researchRecord, 'status', 'state', 'index_status') ?? 'Status returned by API'
    : researchStatusError
      ? 'Unavailable'
      : researchStatusLoading
        ? 'Loading'
        : 'No status returned'

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client and governance overview"
        title="Adviser command center"
        description="A live summary from the connected FastAPI service. Portfolio totals are shown only when the API provides them."
      />

      {healthError && (
        <ErrorState
          title="FastAPI is unavailable"
          message={healthError.message}
          onRetry={() => {
            void refreshClients()
            void refreshAuditLog()
          }}
        />
      )}

      <section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Client profiles"
          value={valueOrUnavailable(clients.length, clientsLoading, clientsError)}
          detail="Returned by GET /clients"
          icon={Users}
        />
        <MetricCard
          label="Audit events"
          value={valueOrUnavailable(auditEntries.length, auditLoading, auditError)}
          detail="Returned by GET /adviser/audit-log"
          icon={History}
          tone="slate"
        />
        <MetricCard
          label="Drafts this session"
          value={String(sessionDrafts.length)}
          detail="No draft-list endpoint is documented; this count is session-only."
          icon={FileCheck2}
          tone="amber"
        />
        <MetricCard
          label="Research service"
          value={researchState}
          detail={researchStatusError ? researchStatusError.message : 'Returned by GET /research/status'}
          icon={FileSearch}
          tone="slate"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base text-navy">Recent API audit events</CardTitle>
              <p className="mt-1 text-sm text-slate-600">Only events returned by the audit endpoint are listed.</p>
            </div>
            <Button nativeButton={false} render={<Link href="/audit-trail" />} variant="outline" size="sm" className="shrink-0">Open audit trail <ArrowUpRight data-icon="inline-end" /></Button>
          </CardHeader>
          <CardContent>
            {auditError ? (
              <ErrorState message={auditError.message} onRetry={() => void refreshAuditLog()} />
            ) : auditLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading events from FastAPI…</p>
            ) : auditEntries.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No audit events returned"
                description="The API has not returned any audit events for this workspace."
              />
            ) : (
              <div className="divide-y divide-border/70">
                {auditEntries.slice(0, 5).map((event, index) => {
                  const action = firstString(event, 'action', 'event_type', 'event', 'activity') ?? 'Audit event'
                  const actor = firstString(event, 'adviser_id', 'actor', 'user_id')
                  const time = firstString(event, 'created_at', 'timestamp', 'occurred_at')
                  const subject = firstString(event, 'client_id', 'draft_id', 'goal_id')
                  return (
                    <div key={`${subject ?? 'event'}-${time ?? index}`} className="flex items-start gap-3 py-4 first:pt-1 last:pb-1">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                        <History className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy">{action}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[actor && `Adviser ${actor}`, subject && `Record ${subject}`, time && formatApiValue(time)]
                            .filter(Boolean)
                            .join(' · ') || 'Additional details are available in the audit trail.'}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-emerald-200 bg-emerald-50/50 text-emerald-800">API</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader>
            <CardTitle className="text-base text-navy">Quick actions</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Open a workflow backed by the connected service.</p>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button nativeButton={false} render={<Link href="/investors" />} variant="outline" className="h-auto justify-between py-3"><span className="flex items-center gap-3"><Users className="size-4 text-emerald-800" />Manage client profiles</span><ArrowUpRight className="size-4" /></Button>
            <Button nativeButton={false} render={<Link href="/risk-assessment" />} variant="outline" className="h-auto justify-between py-3"><span className="flex items-center gap-3"><ShieldCheck className="size-4 text-emerald-800" />Assess client risk</span><ArrowUpRight className="size-4" /></Button>
            <Button nativeButton={false} render={<Link href="/goal-planner" />} variant="outline" className="h-auto justify-between py-3"><span className="flex items-center gap-3"><BarChart3 className="size-4 text-emerald-800" />Plan a financial goal</span><ArrowUpRight className="size-4" /></Button>
            <Button nativeButton={false} render={<Link href="/recommendations" />} variant="outline" className="h-auto justify-between py-3"><span className="flex items-center gap-3"><FileSearch className="size-4 text-emerald-800" />Run an advisory workflow</span><ArrowUpRight className="size-4" /></Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader>
            <CardTitle className="text-base text-navy">Research index status</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Service metadata from GET /research/status.</p>
          </CardHeader>
          <CardContent>
            {researchStatusError ? (
              <ErrorState message={researchStatusError.message} />
            ) : researchStatusLoading ? (
              <p className="py-5 text-sm text-slate-500">Loading research status…</p>
            ) : researchRecord ? (
              <RecordFields record={researchRecord} />
            ) : (
              <EmptyState icon={FileSearch} title="No research status returned" description="The connected service did not return an index status object." />
            )}
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader>
            <CardTitle className="text-base text-navy">Portfolio analytics</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Aggregate charts are intentionally omitted until the API exposes aggregate data.</p>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="No aggregate endpoint documented"
              description="Risk and allocation totals are not inferred from client records. Use the client-level assessment and goal endpoints for verified results."
              action={<Button nativeButton={false} render={<Link href="/investors" />} variant="outline" size="sm">View client profiles</Button>}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
