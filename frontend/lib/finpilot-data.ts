export type ApiRecord = Record<string, unknown>

export type ApiConnectionState = 'connecting' | 'connected' | 'unavailable' | 'unconfigured'
export type SessionDraftStatus = 'created' | 'submitted' | 'approved' | 'rejected'

export type SessionDraft = {
  record: AdviserDraftRecord
  status: SessionDraftStatus
}

export type ClientCreateInput = {
  full_name: string
  email?: string | null
  phone?: string | null
  age?: number | null
  occupation?: string | null
  annual_income?: number | null
  monthly_expenses?: number | null
  existing_investments?: number | null
  emergency_fund?: number | null
  financial_notes?: string | null
}

export type ClientUpdateInput = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  age?: number | null
  occupation?: string | null
  annual_income?: number | null
  monthly_expenses?: number | null
  existing_investments?: number | null
  emergency_fund?: number | null
  financial_notes?: string | null
}

export type ClientResponse = ClientCreateInput & {
  id: string
  email: string | null
  phone: string | null
  age: number | null
  occupation: string | null
  annual_income: number | null
  monthly_expenses: number | null
  existing_investments: number | null
  emergency_fund: number | null
  risk_profile: string | null
  financial_notes: string | null
}

export type ClientRecord = ClientResponse & ApiRecord

export type ClientProfile = {
  client_id: string
  age: number
  monthly_income_inr: number
  income_stability: number
  monthly_essential_expenses_inr: number
  monthly_debt_payments_inr: number
  liquid_savings_inr: number
  dependants: number
  goal_horizon_years: number
  risk_tolerance_score: number
  investment_experience_years: number
  recent_high_risk_losses?: boolean
  notes?: string | null
}

export type RiskAssessmentInput = ClientProfile
export type RiskAssessmentResult = ApiRecord

export type AdvisoryWorkflowInput = Omit<ClientProfile, 'client_id'> & {
  research_question: string
  requested_product_category: string
  requested_outcome?: string
  proposed_equity_allocation_pct?: number | null
  proposed_small_cap_allocation_pct?: number | null
  asks_for_guaranteed_returns?: boolean
  asks_for_extreme_fast_returns?: boolean
  top_k?: number
}

export type ApprovalAction = {
  adviser_id: string
  decision: 'approve' | 'reject'
  reason: string
}

export type FinancialGoalCreate = {
  goal_name: string
  current_goal_cost_inr: number
  years_to_goal: number
  current_goal_savings_inr: number
  monthly_contribution_inr?: number | null
  annual_inflation_assumption?: number
  annual_return_assumption?: number
}

export type FinancialGoalUpdate = {
  goal_name?: string | null
  current_goal_cost_inr?: number | null
  years_to_goal?: number | null
  current_goal_savings_inr?: number | null
  monthly_contribution_inr?: number | null
  annual_inflation_assumption?: number | null
  annual_return_assumption?: number | null
}

export type GoalPlanRequest = FinancialGoalCreate
export type GoalRecord = ApiRecord
export type GoalGlidePathQuery = {
  start_equity_pct: number
  years_to_goal: number
}

export type ResearchSearchInput = {
  question: string
  top_k?: number
}

export type ResearchEvidence = ApiRecord & {
  source?: string
  page?: number
  text?: string
  similarity?: number
}

export type ResearchSearchResponse = ApiRecord & {
  question?: string
  results?: ResearchEvidence[]
  insufficient_evidence?: boolean
  message?: string
}

export type SuitabilityInput = {
  client: ClientProfile
  requested_product_category: string
  requested_outcome?: string
  proposed_equity_allocation_pct?: number | null
  proposed_small_cap_allocation_pct?: number | null
  asks_for_guaranteed_returns?: boolean
  asks_for_extreme_fast_returns?: boolean
}

export type GuardrailStatus = 'allow_for_adviser_review' | 'needs_more_information' | 'blocked_pending_reassessment'

export type GuardrailResult = ApiRecord & {
  status: GuardrailStatus
  flags?: string[]
  explanation?: string[]
  adviser_approval_required?: boolean
  client_delivery_permitted?: boolean
}

export type RecommendationDraftInput = {
  client_id: string
  summary: string
  supporting_facts?: string[]
  source_citations?: ApiRecord[]
  guardrail: GuardrailResult
  status?: 'draft' | 'submitted_for_review' | 'approved' | 'rejected'
}

export type AdviserDraftRecord = ApiRecord & Partial<RecommendationDraftInput>
export type AuditEntry = ApiRecord

export function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function recordFromResponse(value: unknown, wrapperKeys: string[] = []): ApiRecord {
  if (!isApiRecord(value)) {
    throw new Error('FastAPI returned an unexpected object response. Verify its OpenAPI schema.')
  }

  for (const key of wrapperKeys) {
    if (isApiRecord(value[key])) return value[key]
  }

  if (isApiRecord(value.data)) return value.data
  return value
}

export function recordsFromResponse(value: unknown, wrapperKeys: string[] = []): ApiRecord[] {
  if (Array.isArray(value)) return value.filter(isApiRecord)

  if (isApiRecord(value)) {
    for (const key of wrapperKeys) {
      if (Array.isArray(value[key])) return value[key].filter(isApiRecord)
    }
    if (Array.isArray(value.data)) return value.data.filter(isApiRecord)
    if (isApiRecord(value.data)) return recordsFromResponse(value.data, wrapperKeys)
  }

  throw new Error('FastAPI returned an unexpected list response. Verify its OpenAPI schema.')
}

export function firstString(record: ApiRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

export function firstNumber(record: ApiRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return undefined
}

export function firstBoolean(record: ApiRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    if (typeof record[key] === 'boolean') return record[key]
  }
  return undefined
}

export function getClientId(record: ApiRecord): string | undefined {
  return firstString(record, 'id', 'client_id')
}

export function getClientName(record: ApiRecord): string | undefined {
  return firstString(record, 'full_name', 'name')
}

export function getDraftId(record: ApiRecord): string | undefined {
  return firstString(record, 'draft_id', 'id', 'recommendation_id')
}

export function getGoalId(record: ApiRecord): string | undefined {
  return firstString(record, 'goal_id', 'id')
}

export function formatApiValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(formatApiValue).join(', ')
  if (isApiRecord(value)) return JSON.stringify(value)
  return String(value)
}

export function humanizeApiKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase())
}

export function displayableRecordEntries(record: ApiRecord, omittedKeys: string[] = []): Array<[string, unknown]> {
  const omitted = new Set(omittedKeys.map((key) => key.toLowerCase()))
  const sensitiveKey = /(password|secret|token|credential|api.?key|access.?key|aadhaar|pan_number|ssn)/i
  return Object.entries(record).filter(([key]) => !omitted.has(key.toLowerCase()) && !sensitiveKey.test(key))
}

export function apiRecordSearchText(record: ApiRecord): string {
  return displayableRecordEntries(record)
    .map(([key, value]) => `${key} ${formatApiValue(value)}`)
    .join(' ')
    .toLowerCase()
}
