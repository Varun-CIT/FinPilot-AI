import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { InvestorStatus, ProposalStatus, RiskLevel } from '@/lib/finpilot-data'

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 border-emerald/20 bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 ${className}`}
    >
      <span className="size-1.5 rounded-full bg-emerald" aria-hidden="true" />
      Demo data
    </Badge>
  )
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[25px] font-semibold tracking-[-0.04em] text-navy sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-navy">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  change,
  tone = 'emerald',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  change?: string
  tone?: 'emerald' | 'slate' | 'amber' | 'violet'
}) {
  const toneClass = {
    emerald: 'bg-emerald/10 text-emerald-800',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }[tone]

  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.045em] text-navy">
              {value}
            </p>
          </div>
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
            <Icon aria-hidden="true" className="size-[17px]" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
          {change && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
              {change}
            </span>
          )}
          <span className="text-muted-foreground">{detail}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function RiskBadge({ value }: { value: RiskLevel }) {
  const classes: Record<RiskLevel, string> = {
    Low: 'border-slate-200 bg-slate-100 text-slate-700',
    Moderate: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    High: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return (
    <Badge variant="outline" className={`font-medium ${classes[value]}`}>
      {value}
    </Badge>
  )
}

export function InvestorStatusBadge({ status }: { status: InvestorStatus }) {
  const classes: Record<InvestorStatus, string> = {
    Active: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    Onboarding: 'border-sky-100 bg-sky-50 text-sky-800',
    'Review due': 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return (
    <Badge variant="outline" className={`font-medium ${classes[status]}`}>
      {status}
    </Badge>
  )
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const classes: Record<ProposalStatus, string> = {
    'Pending review': 'border-amber-200 bg-amber-50 text-amber-800',
    Approved: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    Rejected: 'border-rose-100 bg-rose-50 text-rose-700',
    'Changes requested': 'border-sky-100 bg-sky-50 text-sky-800',
  }
  return (
    <Badge variant="outline" className={`font-medium ${classes[status]}`}>
      {status}
    </Badge>
  )
}

export function SuitabilityBadge({
  value,
}: {
  value: 'Review required' | 'Potential mismatch' | 'Data incomplete'
}) {
  const classes = {
    'Review required': 'border-slate-200 bg-slate-100 text-slate-700',
    'Potential mismatch': 'border-rose-100 bg-rose-50 text-rose-700',
    'Data incomplete': 'border-amber-200 bg-amber-50 text-amber-800',
  }[value]
  return (
    <Badge variant="outline" className={`font-medium ${classes}`}>
      {value}
    </Badge>
  )
}

export function ChangeIndicator({
  direction,
  children,
}: {
  direction: 'up' | 'down'
  children: ReactNode
}) {
  const Icon = direction === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
      <Icon aria-hidden="true" className="size-3.5" />
      {children}
    </span>
  )
}

export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatINRCompact(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(value >= 100000000 ? 0 : 1)} Cr`
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)} L`
  }
  return formatINR(value)
}
