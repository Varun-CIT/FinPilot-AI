'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import {
  DemoBadge,
  PageHeader,
  SectionHeading,
  SuitabilityBadge,
} from '@/components/finpilot/shared'

const allocationConfig = {
  equity: { label: 'Equity', color: 'var(--chart-1)' },
  fixedIncome: { label: 'Fixed income', color: 'var(--chart-2)' },
  cash: { label: 'Cash & equivalents', color: 'var(--chart-3)' },
  other: { label: 'Other', color: 'var(--chart-4)' },
} satisfies ChartConfig

const allocationColorKeys: Record<string, string> = {
  Equity: 'var(--color-equity)',
  'Fixed income': 'var(--color-fixedIncome)',
  'Cash & equivalents': 'var(--color-cash)',
  Cash: 'var(--color-cash)',
  Other: 'var(--color-other)',
}

export function RecommendationsPage() {
  const { proposals, investors } = useFinPilot()
  const drafts = proposals.filter((proposal) => proposal.status === 'Pending review')
  const [selectedId, setSelectedId] = useState(drafts[0]?.id ?? '')
  const selected = drafts.find((proposal) => proposal.id === selectedId) ?? drafts[0]
  const investor = selected ? investors.find((item) => item.id === selected.investorId) : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Adviser-only proposal workspace"
        title="Recommendations"
        description="Review fictional allocation drafts with their rationale, assumptions, risks, and supporting profile evidence."
        action={<DemoBadge />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-800" />
          <p className="text-[11px] leading-5 text-amber-950"><span className="font-semibold">Drafts only.</span> Every proposal shown here is fictional, pending adviser review, and is not an investment recommendation or client instruction.</p>
        </div>
        <Badge variant="outline" className="border-amber-300 bg-white text-[9px] font-semibold text-amber-900">{drafts.length} pending demo drafts</Badge>
      </div>

      {selected ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(250px,0.68fr)_minmax(0,1.32fr)]">
          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold text-navy">Draft proposals</CardTitle>
              <CardDescription className="text-[11px]">Select a fictional proposal to inspect.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {drafts.map((proposal) => (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => setSelectedId(proposal.id)}
                  aria-pressed={selected.id === proposal.id}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selected.id === proposal.id ? 'border-emerald/35 bg-emerald/[0.06]' : 'border-border/80 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{proposal.id}</span>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[8px] text-amber-900">Draft</Badge>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-navy">{proposal.investorName}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{proposal.goal} · {proposal.horizon}</p>
                  <div className="mt-2.5"><SuitabilityBadge value={proposal.suitability} /></div>
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/adviser-review" />} nativeButton={false}
                className="mt-2 w-full"
              >
                Go to adviser review <ArrowRight data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardHeader className="border-b border-border/70 bg-white pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-[16px] font-semibold text-navy">{selected.goal} · {selected.investorName}</CardTitle>
                      <Badge className="bg-amber-100 text-[9px] text-amber-900 hover:bg-amber-100">DRAFT · REVIEW REQUIRED</Badge>
                    </div>
                    <CardDescription className="mt-1.5 text-[11px]">{selected.id} · Created {selected.createdAt} · Fictional profile</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SuitabilityBadge value={selected.suitability} />
                    <DemoBadge />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.28fr)]">
                <div className="flex flex-col items-center rounded-xl border border-border/70 bg-slate-50/60 px-3 py-4">
                  <p className="self-start text-[11px] font-semibold text-navy">Proposed asset allocation</p>
                  <p className="mt-1 self-start text-[9px] text-muted-foreground">Illustrative only · pending adviser review</p>
                  <ChartContainer config={allocationConfig} className="mt-2 h-[210px] w-full max-w-[260px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                      <Pie
                        data={selected.proposedAllocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {selected.proposedAllocation.map((slice, index) => (
                          <Cell
                            key={slice.name}
                            fill={allocationColorKeys[slice.name] ?? `var(--chart-${index + 1})`}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="grid w-full grid-cols-1 gap-2 px-2 sm:grid-cols-2">
                    {selected.proposedAllocation.map((slice) => (
                      <div key={slice.name} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-[10px] text-slate-600">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="truncate">{slice.name}</span>
                        </span>
                        <span className="text-[10px] font-semibold tabular-nums text-navy">{slice.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Investor goal</p>
                      <p className="mt-1.5 text-xs font-semibold text-navy">{selected.goal}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Illustrative horizon</p>
                      <p className="mt-1.5 text-xs font-semibold text-navy">{selected.horizon}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Risk capacity</p>
                      <p className="mt-1.5 text-xs font-semibold text-navy">{investor?.riskCapacity ?? 'Not recorded'}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">Risk tolerance</p>
                      <p className="mt-1.5 text-xs font-semibold text-navy">{investor?.riskTolerance ?? 'Not recorded'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3.5">
                    <p className="text-[11px] font-semibold text-navy">Rationale</p>
                    <p className="mt-1.5 text-[10px] leading-5 text-slate-600">{selected.rationale}</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <UserRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-slate-500" />
                    <p className="text-[10px] leading-4 text-slate-600">Confirm investor details and objective with the investor before considering any proposal.</p>
                  </div>
                  <Button render={<Link href="/adviser-review" />} nativeButton={false}>Review draft with adviser <ArrowRight data-icon="inline-end" /></Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
                <CardHeader className="pb-3"><SectionHeading title="Assumptions" description="Items to verify before any decision" /></CardHeader>
                <CardContent className="pt-0">
                  <ul className="flex flex-col gap-2.5">
                    {selected.assumptions.map((assumption) => (
                      <li key={assumption} className="flex items-start gap-2.5 text-[10px] leading-4 text-slate-600">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-slate-400" />{assumption}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
                <CardHeader className="pb-3"><SectionHeading title="Risks & review notes" description="Not an automated suitability conclusion" /></CardHeader>
                <CardContent className="pt-0">
                  <ul className="flex flex-col gap-2.5">
                    {selected.risks.map((risk) => (
                      <li key={risk} className="flex items-start gap-2.5 text-[10px] leading-4 text-slate-600">
                        <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-700" />{risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeading title="Supporting evidence" description="Fictional profile excerpt · DEMO" />
                  <FileText aria-hidden="true" className="size-4 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {selected.evidence.map((evidence) => (
                  <div key={`${evidence.documentName}-${evidence.page}`} className="rounded-xl border border-border/70 bg-slate-50/60 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[9px]">{evidence.documentName}</Badge>
                      <Badge variant="secondary" className="text-[9px]">Page {evidence.page}</Badge>
                      <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">{evidence.section}</span>
                    </div>
                    <p className="mt-2.5 text-[10px] leading-5 text-slate-600">“{evidence.excerpt}”</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/80">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <FileText aria-hidden="true" className="size-7 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-navy">No draft proposals available</p>
            <p className="mt-1 text-xs text-muted-foreground">New demo drafts will appear here when available.</p>
            <Button className="mt-4" variant="outline" render={<Link href="/adviser-review" />} nativeButton={false}>Open adviser review</Button>
          </CardContent>
        </Card>
      )}
      <p className="text-[10px] leading-4 text-slate-500">All allocation values shown are fictional workflow examples, not model portfolios, live market data, or investment advice.</p>
    </div>
  )
}
