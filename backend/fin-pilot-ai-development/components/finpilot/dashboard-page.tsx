'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CircleDollarSign,
  ClipboardCheck,
  FileSearch,
  Plus,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
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
import { Badge } from '@/components/ui/badge'
import {
  DEMO_ACTIVITY,
  DEMO_ALLOCATION,
  DEMO_PROPOSALS,
  DEMO_RISK_DISTRIBUTION,
} from '@/lib/finpilot-data'
import {
  DemoBadge,
  MetricCard,
  PageHeader,
  ProposalStatusBadge,
  SuitabilityBadge,
} from '@/components/finpilot/shared'

const allocationKeys = ['equity', 'fixedIncome', 'cash', 'other'] as const
const allocationConfig = {
  equity: { label: 'Equity', color: 'var(--chart-1)' },
  fixedIncome: { label: 'Fixed income', color: 'var(--chart-2)' },
  cash: { label: 'Cash', color: 'var(--chart-3)' },
  other: { label: 'Other', color: 'var(--chart-5)' },
} satisfies ChartConfig

const riskConfig = {
  count: { label: 'Demo investors', color: 'var(--chart-1)' },
  low: { label: 'Low', color: 'var(--chart-2)' },
  moderate: { label: 'Moderate', color: 'var(--chart-1)' },
  high: { label: 'High', color: 'var(--chart-3)' },
} satisfies ChartConfig

const allocationRows = DEMO_ALLOCATION.map((slice, index) => ({
  ...slice,
  key: allocationKeys[index],
  fill: `var(--color-${allocationKeys[index]}, ${slice.color})`,
}))

function QuickAction({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string
  icon: typeof Plus
  label: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[72px] items-center gap-3 rounded-xl border border-border/80 bg-white px-4 py-3 transition hover:border-emerald/35 hover:shadow-[0_4px_16px_rgba(16,24,40,0.06)]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald-800 transition group-hover:bg-emerald/15">
        <Icon aria-hidden="true" className="size-[17px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-navy">{label}</span>
        <span className="mt-1 block truncate text-[10px] text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
    </Link>
  )
}

export function DashboardPage() {
  const pendingProposals = DEMO_PROPOSALS.filter((proposal) => proposal.status === 'Pending review')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Thursday, 29 October 2026 · Adviser workspace"
        title="Good morning, Adviser"
        description="A clear view of your investor workflows, goals, and decisions that need a human review."
        action={<DemoBadge />}
      />

      <section aria-label="Workspace summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total investors"
          value="248"
          detail="Fictional demo profiles"
          icon={Users}
          change="12"
          tone="emerald"
        />
        <MetricCard
          label="Active goals"
          value="612"
          detail="Across demo profiles"
          icon={Target}
          change="8"
          tone="slate"
        />
        <MetricCard
          label="Pending reviews"
          value="12"
          detail="3 shown in this queue"
          icon={ClipboardCheck}
          tone="amber"
        />
        <MetricCard
          label="Research queries"
          value="34"
          detail="Demo session activity"
          icon={FileSearch}
          change="5"
          tone="violet"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-1">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Portfolio allocation</CardTitle>
              <CardDescription className="mt-1 text-xs">Illustrative aggregate · fictional demo data</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600">
              Sample mix
            </Badge>
          </CardHeader>
          <CardContent className="grid items-center gap-5 pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.9fr)]">
            <div className="relative mx-auto w-full max-w-[270px]">
              <ChartContainer config={allocationConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={allocationRows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={66}
                    outerRadius={91}
                    paddingAngle={3}
                    strokeWidth={0}
                  />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-semibold tracking-[-0.05em] text-navy">100%</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">demo allocation</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {allocationRows.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-xs font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-navy">{item.value}%</span>
                </div>
              ))}
              <p className="mt-1 border-t border-border/70 pt-3 text-[10px] leading-4 text-muted-foreground">
                These proportions are synthetic UI data, not actual investor holdings or a model portfolio.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-1">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Investor risk distribution</CardTitle>
              <CardDescription className="mt-1 text-xs">Recorded demo capacity bands · not suitability scores</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <CircleDollarSign aria-hidden="true" className="size-3.5" />
              248 profiles
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={riskConfig} className="h-[220px] w-full">
              <BarChart
                accessibilityLayer
                data={DEMO_RISK_DISTRIBUTION}
                margin={{ left: -16, right: 8, top: 6, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="band"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  domain={[0, 160]}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {DEMO_RISK_DISTRIBUTION.map((row, index) => {
                    const key = ['low', 'moderate', 'high'][index]
                    return <Cell key={row.band} fill={`var(--color-${key})`} />
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Capacity and tolerance are assessed separately for each investor. Higher tolerance alone never establishes suitability.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Quick actions</h2>
            <p className="mt-1 text-xs text-muted-foreground">Start a common adviser workflow</p>
          </div>
          <span className="hidden items-center gap-1.5 text-[10px] text-slate-500 sm:flex">
            <BookOpenCheck aria-hidden="true" className="size-3.5" />
            Actions use demo records
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction href="/investors" icon={Plus} label="New investor" detail="Add a fictional profile" />
          <QuickAction href="/risk-assessment" icon={ShieldCheck} label="Assess risk" detail="Review capacity and tolerance" />
          <QuickAction href="/goal-planner" icon={Target} label="Plan a goal" detail="Explore an illustrative projection" />
          <QuickAction href="/fund-research" icon={FileSearch} label="Research a fund" detail="Ask against demo evidence" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Recent investor activity</CardTitle>
              <CardDescription className="mt-1 text-xs">A fictional activity stream for this demo workspace</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs text-slate-600"
              render={<Link href="/investors" />} nativeButton={false}
            >
              All investors <ArrowUpRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[590px] text-left">
                <thead>
                  <tr className="border-y bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-5 py-3">Investor</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACTIVITY.map((activity) => (
                    <tr key={activity.id} className="border-b last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <Link href="/investors" className="text-xs font-semibold text-navy hover:text-emerald-700">
                          {activity.investorName}
                        </Link>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{activity.investorId}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{activity.action}</td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-500">{activity.timestamp}</td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={
                            activity.status === 'Pending'
                              ? 'border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-800'
                              : activity.status === 'Needs review'
                                ? 'border-sky-100 bg-sky-50 text-[10px] font-medium text-sky-800'
                                : 'border-emerald-100 bg-emerald-50 text-[10px] font-medium text-emerald-800'
                          }
                        >
                          {activity.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-[15px] font-semibold text-navy">Pending adviser reviews</CardTitle>
              <CardDescription className="mt-1 text-xs">Drafts awaiting human judgement</CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800">
              {pendingProposals.length} demo drafts
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {pendingProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href="/adviser-review"
                className="rounded-xl border border-border/70 bg-white p-3.5 transition hover:border-emerald/30 hover:bg-emerald/[0.025]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-navy">{proposal.investorName}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{proposal.goal} · {proposal.horizon}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <ProposalStatusBadge status={proposal.status} />
                  <SuitabilityBadge value={proposal.suitability} />
                </div>
              </Link>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-9 w-full justify-between border-border/80 text-xs"
              render={<Link href="/adviser-review" />} nativeButton={false}
            >
              Open adviser review <ArrowRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <p className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-[11px] leading-5 text-slate-500">
        <span className="font-semibold text-slate-700">Demo data notice:</span> all names, counts, activity, allocations, and review items on this dashboard are fictional examples for product demonstration. They are not actual investor records, live market data, or financial advice.
      </p>
    </div>
  )
}
