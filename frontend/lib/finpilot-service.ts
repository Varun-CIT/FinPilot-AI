import {
  isApiRecord,
  recordFromResponse,
  recordsFromResponse,
  type AdvisoryWorkflowInput,
  type ApiRecord,
  type ApprovalAction,
  type ClientCreateInput,
  type ClientRecord,
  type ClientUpdateInput,
  type FinancialGoalCreate,
  type FinancialGoalUpdate,
  type GoalGlidePathQuery,
  type GoalPlanRequest,
  type ResearchSearchInput,
  type ResearchSearchResponse,
  type RiskAssessmentInput,
  type SuitabilityInput,
  type RecommendationDraftInput,
} from '@/lib/finpilot-data'

const developmentBaseUrl = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:8000'
  : ''

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || developmentBaseUrl
).replace(/\/+$/, '')

function validationMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) => {
      if (!isApiRecord(item)) return []
      const message = typeof item.msg === 'string' ? item.msg : undefined
      const location = Array.isArray(item.loc) ? item.loc.join(' → ') : undefined
      return message ? [`${location ? `${location}: ` : ''}${message}`] : []
    })
    if (messages.length) return messages.join(' · ')
  }
  if (detail === null || detail === undefined) return undefined
  return JSON.stringify(detail)
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('FastAPI is not configured. Set NEXT_PUBLIC_API_BASE_URL to the backend URL.')
  }

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    })
  } catch {
    throw new Error(
      `Could not reach FastAPI at ${API_BASE_URL}. Confirm the server is running and CORS allows this frontend origin.`,
    )
  }

  const responseText = await response.text()
  let payload: unknown = null
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    const detail = isApiRecord(payload) ? payload.detail ?? payload.message : payload
    throw new Error(validationMessage(detail) || `FastAPI request failed (${response.status}).`)
  }

  return payload as T
}

export function apiFetcher(path: string): Promise<unknown> {
  return requestJson<unknown>(path)
}

export function getHealth(): Promise<unknown> {
  return requestJson<unknown>('/health')
}

function clientRecordFromResponse(value: unknown): ClientRecord {
  const record = recordFromResponse(value, ['client'])
  if (typeof record.id !== 'string' || typeof record.full_name !== 'string') {
    throw new Error('Client response is missing the id or full_name fields from the OpenAPI schema.')
  }
  return record as ClientRecord
}

export async function getClients(): Promise<ClientRecord[]> {
  return recordsFromResponse(await requestJson<unknown>('/clients')).map(clientRecordFromResponse)
}

export async function getClient(clientId: string): Promise<ClientRecord> {
  return clientRecordFromResponse(await requestJson<unknown>(`/clients/${encodeURIComponent(clientId)}`))
}

export async function createClient(input: ClientCreateInput): Promise<ClientRecord> {
  return clientRecordFromResponse(await requestJson<unknown>('/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function updateClient(clientId: string, input: ClientUpdateInput): Promise<unknown> {
  return requestJson<unknown>(`/clients/${encodeURIComponent(clientId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteClient(clientId: string): Promise<void> {
  await requestJson<unknown>(`/clients/${encodeURIComponent(clientId)}`, { method: 'DELETE' })
}

export async function assessRisk(input: RiskAssessmentInput): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>('/risk/assess', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function planGoal(input: GoalPlanRequest): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>('/goals/plan', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function getGoalGlidePath(input: GoalGlidePathQuery): Promise<unknown> {
  const query = new URLSearchParams({
    start_equity_pct: String(input.start_equity_pct),
    years_to_goal: String(input.years_to_goal),
  })
  return requestJson<unknown>(`/goals/glide-path?${query.toString()}`)
}

export async function getClientGoals(clientId: string): Promise<ApiRecord[]> {
  return recordsFromResponse(await requestJson<unknown>(`/clients/${encodeURIComponent(clientId)}/goals`))
}

export async function getClientGoal(clientId: string, goalId: string): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>(
    `/clients/${encodeURIComponent(clientId)}/goals/${encodeURIComponent(goalId)}`,
  ))
}

export function createClientGoal(clientId: string, input: FinancialGoalCreate): Promise<unknown> {
  return requestJson<unknown>(`/clients/${encodeURIComponent(clientId)}/goals`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateClientGoal(
  clientId: string,
  goalId: string,
  input: FinancialGoalUpdate,
): Promise<unknown> {
  return requestJson<unknown>(
    `/clients/${encodeURIComponent(clientId)}/goals/${encodeURIComponent(goalId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  )
}

export async function deleteClientGoal(clientId: string, goalId: string): Promise<void> {
  await requestJson<unknown>(
    `/clients/${encodeURIComponent(clientId)}/goals/${encodeURIComponent(goalId)}`,
    { method: 'DELETE' },
  )
}

export async function getResearchStatus(): Promise<unknown> {
  return requestJson<unknown>('/research/status')
}

export async function searchResearch(input: ResearchSearchInput): Promise<ResearchSearchResponse> {
  const response = await requestJson<unknown>('/research/search', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (Array.isArray(response)) return { results: response.filter(isApiRecord) }

  const result = recordFromResponse(response)
  return {
    ...result,
    results: Array.isArray(result.results) ? result.results.filter(isApiRecord) : undefined,
    insufficient_evidence: typeof result.insufficient_evidence === 'boolean'
      ? result.insufficient_evidence
      : undefined,
    message: typeof result.message === 'string' ? result.message : undefined,
  }
}

export async function checkSuitability(input: SuitabilityInput): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>('/suitability/check', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function runAdvisoryWorkflow(clientId: string, input: AdvisoryWorkflowInput): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>(
    `/clients/${encodeURIComponent(clientId)}/advisory-workflow`,
    { method: 'POST', body: JSON.stringify(input) },
  ))
}

export async function createAdviserDraft(input: RecommendationDraftInput): Promise<ApiRecord> {
  return recordFromResponse(await requestJson<unknown>('/adviser/drafts', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function submitAdviserDraft(draftId: string): Promise<unknown> {
  return requestJson<unknown>(`/adviser/drafts/${encodeURIComponent(draftId)}/submit`, {
    method: 'POST',
  })
}

export async function decideAdviserDraft(draftId: string, input: ApprovalAction): Promise<unknown> {
  return requestJson<unknown>(`/adviser/drafts/${encodeURIComponent(draftId)}/decision`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getAdviserAuditLog(): Promise<ApiRecord[]> {
  return recordsFromResponse(await requestJson<unknown>('/adviser/audit-log'))
}
