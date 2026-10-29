import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle2, LoaderCircle, ServerOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  displayableRecordEntries,
  formatApiValue,
  humanizeApiKey,
  type ApiConnectionState,
  type ApiRecord,
} from '@/lib/finpilot-data'

const apiStatusConfig: Record<ApiConnectionState, { label: string; icon: LucideIcon; classes: string }> = {
  connecting: {
    label: 'Connecting to FastAPI',
    icon: LoaderCircle,
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  connected: {
    label: 'FastAPI connected',
    icon: CheckCircle2,
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  unavailable: {
    label: 'Backend unavailable',
    icon: ServerOff,
    classes: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  unconfigured: {
    label: 'API not configured',
    icon: AlertCircle,
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
  },
}

export function ApiStatusBadge({ status }: { status: ApiConnectionState }) {
  const config = apiStatusConfig[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`gap-1.5 rounded-full px-2.5 py-1 font-medium ${config.classes}`}>
      <Icon className={`size-3.5 ${status === 'connecting' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {config.label}
    </Badge>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-[2.05rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
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
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
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
  tone = 'forest',
}: {
  label: string
  value: ReactNode
  detail: string
  icon: LucideIcon
  tone?: 'forest' | 'slate' | 'amber'
}) {
  const iconClasses = {
    forest: 'bg-emerald-50 text-emerald-800',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-800',
  }[tone]

  return (
    <Card className="border border-border/80 bg-card shadow-sm shadow-emerald-950/[0.03]">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-navy">{value}</div>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/70 px-6 py-10 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Unable to load API data',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-rose-950">{title}</p>
          <p className="mt-1 text-sm leading-5 text-rose-900">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" className="shrink-0 border-rose-300 text-rose-900 hover:bg-rose-100" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

export function RecordFields({
  record,
  omittedKeys = [],
}: {
  record: ApiRecord
  omittedKeys?: string[]
}) {
  const entries = displayableRecordEntries(record, omittedKeys)
  if (!entries.length) return <p className="text-sm text-slate-500">No displayable fields were returned.</p>

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0 rounded-xl border border-border/70 bg-white/70 px-3.5 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">{humanizeApiKey(key)}</dt>
          <dd className="mt-1.5 break-words text-sm leading-5 text-navy">{formatApiValue(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RecordCard({
  title,
  subtitle,
  record,
  action,
}: {
  title: string
  subtitle?: string
  record: ApiRecord
  action?: ReactNode
}) {
  return (
    <Card className="border border-border/80 bg-card shadow-sm shadow-emerald-950/[0.03]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-sm font-semibold text-navy">{title}</CardTitle>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-0">
        <RecordFields record={record} />
      </CardContent>
    </Card>
  )
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
