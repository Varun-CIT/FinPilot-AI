'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Clock3, FileCheck2, ShieldAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { EmptyState, ErrorState, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { getClientName, getDraftId, firstString } from '@/lib/finpilot-data'

const statusStyles = {
  created: 'border-slate-200 bg-slate-50 text-slate-700',
  submitted: 'border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
} as const

export function ReviewPage() {
  const { sessionDrafts, clients, submitDraft, decideDraft, auditError } = useFinPilot()
  const [adviserId, setAdviserId] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [pendingDecision, setPendingDecision] = useState<{
    draftId: string
    decision: 'approve' | 'reject'
  } | null>(null)

  async function submitForReview(draftId: string) {
    setBusyId(draftId)
    setError('')
    try {
      await submitDraft(draftId)
      toast.success('Draft submitted for adviser review.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Draft submission failed.')
    } finally {
      setBusyId('')
    }
  }

  async function decide(draftId: string, decision: 'approve' | 'reject') {
    const reason = reasons[draftId]?.trim()
    if (!adviserId.trim() || adviserId.trim().length > 100 || !reason || reason.length < 3 || reason.length > 1000) {
      setError('Enter an API-recognized adviser ID (100 characters or fewer) and a decision reason between 3 and 1000 characters.')
      return
    }
    setBusyId(draftId)
    setError('')
    try {
      await decideDraft(draftId, decision, reason, adviserId.trim())
      toast.success(decision === 'approve' ? 'Draft approved.' : 'Draft rejected.')
      setPendingDecision(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The adviser decision failed.')
      setPendingDecision(null)
    } finally {
      setBusyId('')
    }
  }

  function requestDecision(draftId: string, decision: 'approve' | 'reject') {
    const reason = reasons[draftId]?.trim()
    if (!adviserId.trim() || adviserId.trim().length > 100 || !reason || reason.length < 3 || reason.length > 1000) {
      setError('Enter an API-recognized adviser ID (100 characters or fewer) and a decision reason between 3 and 1000 characters.')
      return
    }
    setError('')
    setPendingDecision({ draftId, decision })
  }

  const pendingDraft = pendingDecision
    ? sessionDrafts.find(({ record }) => getDraftId(record) === pendingDecision.draftId)?.record
    : undefined
  const pendingSummary = pendingDraft ? firstString(pendingDraft, 'summary') : undefined
  const pendingReason = pendingDecision ? reasons[pendingDecision.draftId]?.trim() : undefined

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Governance and human oversight" title="Adviser review" description="Submit and decide drafts through the documented API. No recommendation is delivered to a client or executed from this screen." action={<Button nativeButton={false} render={<Link href="/recommendations" />} variant="outline">Create workflow draft <ArrowUpRight data-icon="inline-end" /></Button>} />
      {error && <ErrorState message={error} />}
      {auditError && <ErrorState title="Audit log unavailable" message={auditError.message} />}

      <Card className="border-amber-200 bg-amber-50/60 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm leading-6 text-amber-950">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div><p className="font-semibold">Session-only draft list</p><p>The API documents create, submit, and decision routes but no GET draft-list route. This page shows only drafts created in the current browser session; it does not invent a persistent queue.</p></div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
        <CardHeader><CardTitle className="text-base text-navy">Adviser identity</CardTitle><p className="text-sm text-slate-600">ApprovalAction requires an API-recognized adviser_id. The OpenAPI decision enum supports approve and reject only; request changes is not exposed.</p></CardHeader>
        <CardContent className="max-w-md"><Field><FieldLabel htmlFor="review-adviser-id">Adviser ID</FieldLabel><Input id="review-adviser-id" maxLength={100} placeholder="Enter an adviser ID" value={adviserId} onChange={(event) => setAdviserId(event.target.value)} /><FieldDescription>Required for approve/reject decisions; no example identity is prefilled.</FieldDescription></Field></CardContent>
      </Card>

      {sessionDrafts.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No drafts available in this session" description="Run an advisory workflow and create an adviser draft to begin review." action={<Button nativeButton={false} render={<Link href="/recommendations" />}>Open recommendations</Button>} />
      ) : (
        <div className="space-y-4">
          {sessionDrafts.map(({ record, status }, index) => {
            const id = getDraftId(record)
            const clientId = firstString(record, 'client_id')
            const client = clients.find((item) => item.id === clientId)
            const title = firstString(record, 'summary') ?? `Adviser draft ${index + 1}`
            const busy = !!id && busyId === id
            return (
              <Card key={id ?? index} className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><CardTitle className="text-base text-navy">{title}</CardTitle><p className="mt-1 text-xs text-slate-500">{client ? getClientName(client) : clientId ? `Client ${clientId}` : 'Client id not returned'}{id ? ` · Draft ${id}` : ' · Draft id not returned'}</p></div>
                  <Badge variant="outline" className={statusStyles[status]}>{status.replaceAll('_', ' ')}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RecordFields record={record} />
                  {!id && <p className="text-sm text-amber-800">The create response did not include a draft id, so submit and decision actions are disabled.</p>}
                  {status === 'created' && id && <Button variant="outline" onClick={() => void submitForReview(id)} disabled={busy}><Clock3 data-icon="inline-start" />{busy ? 'Submitting…' : 'Submit for review'}</Button>}
                  {status === 'submitted' && id && (
                    <div className="space-y-4 border-t border-border/70 pt-4">
                      <FieldGroup>
                        <Field><FieldLabel htmlFor={`reason-${id}`}>Decision reason</FieldLabel><Textarea id={`reason-${id}`} required minLength={3} maxLength={1000} rows={3} value={reasons[id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [id]: event.target.value }))} /><FieldDescription>Reason is sent with the adviser decision and recorded by the API.</FieldDescription></Field>
                      </FieldGroup>
                      <div className="flex flex-wrap gap-2"><Button onClick={() => requestDecision(id, 'approve')} disabled={busy}><Check data-icon="inline-start" />Approve</Button><Button variant="destructive" onClick={() => requestDecision(id, 'reject')} disabled={busy}><X data-icon="inline-start" />Reject</Button></div>
                    </div>
                  )}
                  {(status === 'approved' || status === 'rejected') && <p className="text-sm text-slate-600">Decision was accepted by the API. Client delivery and order execution remain disabled.</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <AlertDialog
        open={pendingDecision !== null}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingDecision(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDecision?.decision === 'approve' ? 'Approve this draft?' : 'Reject this draft?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="max-h-40 overflow-y-auto break-words">
              {pendingDecision
                ? `Confirm ${pendingDecision.decision} for ${pendingSummary ?? 'this recommendation draft'}. Reason: ${pendingReason ?? 'Not provided'}.`
                : 'Confirm the adviser decision.'}{' '}
              This decision will be recorded by FastAPI; no client message or order will be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingDecision?.decision === 'reject' ? 'destructive' : 'default'}
              disabled={!pendingDecision || busyId === pendingDecision?.draftId}
              onClick={() => {
                if (pendingDecision) void decide(pendingDecision.draftId, pendingDecision.decision)
              }}
            >
              {busyId ? 'Saving decision…' : pendingDecision?.decision === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
