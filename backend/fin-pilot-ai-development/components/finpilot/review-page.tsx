'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  MessageSquareText,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import {
  DemoBadge,
  PageHeader,
  RiskBadge,
  SuitabilityBadge,
} from '@/components/finpilot/shared'
import type { ProposalStatus } from '@/lib/finpilot-data'

export function ReviewPage() {
  const { proposals, investors, reviewProposal } = useFinPilot()
  const pendingProposals = proposals.filter((proposal) => proposal.status === 'Pending review')
  const [selectedId, setSelectedId] = useState(pendingProposals[0]?.id ?? '')
  const selected = pendingProposals.find((proposal) => proposal.id === selectedId) ?? pendingProposals[0]
  const investor = selected ? investors.find((record) => record.id === selected.investorId) : undefined
  const [confirmAction, setConfirmAction] = useState<Extract<ProposalStatus, 'Approved' | 'Rejected'> | null>(null)
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [changeNote, setChangeNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitDecision(status: ProposalStatus, note?: string) {
    if (!selected) return
    setIsSubmitting(true)
    try {
      await reviewProposal(selected.id, status, note)
      const message = status === 'Changes requested'
        ? 'Changes requested on the demo draft'
        : `Demo review recorded: ${status.toLowerCase()}`
      toast.success(message, {
        description: 'The review state and audit entry were updated for this session only.',
      })
      setConfirmAction(null)
      setRequestChangesOpen(false)
      setChangeNote('')
    } catch (error) {
      toast.error('Review action could not be saved', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRequestChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (changeNote.trim().length < 8) return
    await submitDecision('Changes requested', changeNote.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Human-in-the-loop control"
        title="Adviser review"
        description="Inspect the demo proposal, risk flags, assumptions, and evidence before recording a review decision."
        action={<DemoBadge />}
      />

      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle className="text-xs font-semibold">Demo actions are not client approvals</AlertTitle>
        <AlertDescription className="text-[11px] leading-5 text-amber-900">
          Approve, reject, and request-changes actions update only the fictional in-session workflow. They do not create, send, or execute an investment recommendation.
        </AlertDescription>
      </Alert>

      {selected ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-[14px] font-semibold text-navy">Pending queue</CardTitle>
                  <CardDescription className="mt-1 text-[11px]">{pendingProposals.length} fictional drafts need review</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[9px]">DEMO</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {pendingProposals.map((proposal) => (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => setSelectedId(proposal.id)}
                  aria-pressed={selected.id === proposal.id}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${selected.id === proposal.id ? 'border-emerald/35 bg-emerald/[0.06]' : 'border-border/80 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{proposal.id}</span>
                    <span className="size-2 rounded-full bg-amber-400" aria-label="Pending review" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-navy">{proposal.investorName}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{proposal.goal} · {proposal.horizon}</p>
                  <div className="mt-2.5"><SuitabilityBadge value={proposal.suitability} /></div>
                </button>
              ))}
              <Button variant="outline" size="sm" render={<Link href="/recommendations" />} nativeButton={false} className="mt-2 w-full">
                View all draft proposals <ArrowRight data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardHeader className="border-b border-border/70 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-[16px] font-semibold text-navy">{selected.investorName} · {selected.goal}</CardTitle>
                      <Badge className="bg-amber-100 text-[9px] text-amber-900 hover:bg-amber-100">DRAFT</Badge>
                    </div>
                    <CardDescription className="mt-1.5 text-[11px]">{selected.id} · Created {selected.createdAt}</CardDescription>
                  </div>
                  <SuitabilityBadge value={selected.suitability} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Goal horizon</p>
                    <p className="mt-1.5 text-xs font-semibold text-navy">{selected.horizon}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Risk capacity</p>
                    {investor ? <div className="mt-1.5"><RiskBadge value={investor.riskCapacity} /></div> : <p className="mt-1.5 text-xs text-muted-foreground">Not recorded</p>}
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Risk tolerance</p>
                    {investor ? <div className="mt-1.5"><RiskBadge value={investor.riskTolerance} /></div> : <p className="mt-1.5 text-xs text-muted-foreground">Not recorded</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-slate-50/50 p-3.5">
                  <div className="flex items-center gap-2">
                    <UserRound aria-hidden="true" className="size-3.5 text-slate-500" />
                    <p className="text-[11px] font-semibold text-navy">Investor context · DEMO</p>
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-slate-600">{selected.rationale}</p>
                </div>

                <Alert className={selected.risks.length > 1 ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-slate-200 bg-slate-50 text-navy'}>
                  <ShieldAlert aria-hidden="true" />
                  <AlertTitle className="text-xs font-semibold">Risk warnings and review notes</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 flex flex-col gap-1.5 text-[10px] leading-4">
                      {selected.risks.map((risk) => <li key={risk}>• {risk}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div>
                  <p className="mb-2 text-[11px] font-semibold text-navy">Proposed allocation · illustrative only</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {selected.proposedAllocation.map((slice) => (
                      <div key={slice.name} className="flex items-center justify-between rounded-lg border border-border/70 bg-white px-3 py-2.5">
                        <span className="flex items-center gap-2 text-[10px] text-slate-600"><span className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />{slice.name}</span>
                        <span className="text-[10px] font-semibold tabular-nums text-navy">{slice.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold text-navy">Assumptions to verify</p>
                  <ul className="flex flex-col gap-1.5">
                    {selected.assumptions.map((assumption) => (
                      <li key={assumption} className="flex items-start gap-2 text-[10px] leading-4 text-slate-600"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-slate-400" />{assumption}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-navy">Supporting evidence</p>
                    <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Fictional source · DEMO</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selected.evidence.map((evidence) => (
                      <article key={`${evidence.documentName}-${evidence.page}`} className="rounded-xl border border-border/70 bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText aria-hidden="true" className="size-3.5 text-slate-400" />
                          <span className="text-[10px] font-semibold text-navy">{evidence.documentName}</span>
                          <Badge variant="secondary" className="text-[8px]">Page {evidence.page}</Badge>
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-slate-600">{evidence.excerpt}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-sm text-[9px] leading-4 text-slate-500">Review the full investor record and source material. The actions below only update this demo session.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => setRequestChangesOpen(true)}>
                      <MessageSquareText data-icon="inline-start" /> Request changes
                    </Button>
                    <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={() => setConfirmAction('Rejected')}>
                      <X data-icon="inline-start" /> Reject
                    </Button>
                    <Button size="sm" disabled={isSubmitting} onClick={() => setConfirmAction('Approved')}>
                      <Check data-icon="inline-start" /> Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/80">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <Check aria-hidden="true" className="size-8 text-emerald" />
            <p className="mt-3 text-sm font-semibold text-navy">No pending demo reviews</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">All demo proposals have a recorded session status. New drafts will appear here when available.</p>
            <Button className="mt-4" variant="outline" render={<Link href="/recommendations" />} nativeButton={false}>View recommendations</Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open && !isSubmitting) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction === 'Approved' ? 'Record a demo approval?' : 'Record a demo rejection?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'Approved'
                ? 'Confirm only after reviewing the displayed risks, assumptions, and evidence. This records a fictional workflow state and does not approve a real investment.'
                : 'This will mark the fictional draft as rejected in this session and add an audit entry. No real investor or investment is affected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting || !confirmAction}
              variant={confirmAction === 'Rejected' ? 'destructive' : 'default'}
              onClick={() => confirmAction && void submitDecision(confirmAction)}
            >
              {isSubmitting ? 'Recording…' : `Confirm ${confirmAction === 'Approved' ? 'approval' : 'rejection'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={requestChangesOpen} onOpenChange={(open) => { if (!isSubmitting) setRequestChangesOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes to this draft</DialogTitle>
            <DialogDescription>Enter a clear note for the demo audit trail. This remains in the current session only.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestChanges}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="review-change-note">Review note</FieldLabel>
                <Textarea
                  id="review-change-note"
                  value={changeNote}
                  onChange={(event) => setChangeNote(event.target.value)}
                  placeholder="Describe what needs to be clarified or revised…"
                  required
                  minLength={8}
                  rows={4}
                />
                <FieldDescription>Use at least 8 characters; do not enter real investor data.</FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setRequestChangesOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || changeNote.trim().length < 8}>
                {isSubmitting ? 'Submitting…' : 'Request changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
