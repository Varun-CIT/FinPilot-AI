'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import useSWR from 'swr'
import {
  getDraftId,
  type ApiConnectionState,
  type ApiRecord,
  type AuditEntry,
  type ClientRecord,
  type ClientCreateInput,
  type ClientUpdateInput,
  type FinancialGoalCreate,
  type FinancialGoalUpdate,
  type RecommendationDraftInput,
  type SessionDraft,
  type SessionDraftStatus,
} from '@/lib/finpilot-data'
import {
  API_BASE_URL,
  createAdviserDraft as createAdviserDraftRequest,
  createClient as createClientRequest,
  createClientGoal as createClientGoalRequest,
  decideAdviserDraft as decideAdviserDraftRequest,
  deleteClient as deleteClientRequest,
  deleteClientGoal as deleteClientGoalRequest,
  getAdviserAuditLog,
  getClients,
  getHealth,
  getResearchStatus,
  submitAdviserDraft as submitAdviserDraftRequest,
  updateClient as updateClientRequest,
  updateClientGoal as updateClientGoalRequest,
} from '@/lib/finpilot-service'

type FinPilotContextValue = {
  apiStatus: ApiConnectionState
  apiBaseUrl: string
  healthError?: Error
  clients: ClientRecord[]
  clientsLoading: boolean
  clientsError?: Error
  auditEntries: AuditEntry[]
  auditLoading: boolean
  auditError?: Error
  researchStatus?: unknown
  researchStatusLoading: boolean
  researchStatusError?: Error
  sessionDrafts: SessionDraft[]
  refreshClients: () => Promise<ClientRecord[] | undefined>
  refreshAuditLog: () => Promise<AuditEntry[] | undefined>
  createClient: (input: ClientCreateInput) => Promise<ApiRecord>
  updateClient: (clientId: string, input: ClientUpdateInput) => Promise<void>
  deleteClient: (clientId: string) => Promise<void>
  saveClientGoal: (clientId: string, input: FinancialGoalCreate) => Promise<void>
  updateGoal: (clientId: string, goalId: string, input: FinancialGoalUpdate) => Promise<void>
  deleteGoal: (clientId: string, goalId: string) => Promise<void>
  createDraft: (input: RecommendationDraftInput) => Promise<ApiRecord>
  submitDraft: (draftId: string) => Promise<void>
  decideDraft: (draftId: string, decision: 'approve' | 'reject', reason: string, adviserId: string) => Promise<void>
}

const FinPilotContext = createContext<FinPilotContextValue | null>(null)

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
}

function asError(error: unknown): Error | undefined {
  return error instanceof Error ? error : undefined
}

function updateSessionDraftStatus(
  records: SessionDraft[],
  draftId: string,
  status: SessionDraftStatus,
): SessionDraft[] {
  return records.map((item) => getDraftId(item.record) === draftId ? { ...item, status } : item)
}

export function FinPilotProvider({ children }: { children: ReactNode }) {
  const [sessionDrafts, setSessionDrafts] = useState<SessionDraft[]>([])
  const healthQuery = useSWR<unknown>('/health', getHealth, {
    ...swrOptions,
    refreshInterval: 60_000,
  })
  const clientsQuery = useSWR<ClientRecord[]>('/clients', getClients, swrOptions)
  const auditQuery = useSWR<AuditEntry[]>('/adviser/audit-log', getAdviserAuditLog, swrOptions)
  const researchQuery = useSWR<unknown>('/research/status', getResearchStatus, swrOptions)

  const apiStatus: ApiConnectionState = !API_BASE_URL
    ? 'unconfigured'
    : healthQuery.error
      ? 'unavailable'
      : healthQuery.isLoading || healthQuery.data === undefined
        ? 'connecting'
        : 'connected'

  const refreshClients = useCallback(() => clientsQuery.mutate(), [clientsQuery.mutate])
  const refreshAuditLog = useCallback(() => auditQuery.mutate(), [auditQuery.mutate])

  const refreshData = useCallback(async () => {
    await Promise.allSettled([clientsQuery.mutate(), auditQuery.mutate()])
  }, [clientsQuery.mutate, auditQuery.mutate])

  const createClient = useCallback(async (input: ClientCreateInput) => {
    const result = await createClientRequest(input)
    await refreshData()
    return result
  }, [refreshData])

  const updateClient = useCallback(async (clientId: string, input: ClientUpdateInput) => {
    await updateClientRequest(clientId, input)
    await refreshData()
  }, [refreshData])

  const deleteClient = useCallback(async (clientId: string) => {
    await deleteClientRequest(clientId)
    await refreshData()
  }, [refreshData])

  const saveClientGoal = useCallback(async (clientId: string, input: FinancialGoalCreate) => {
    await createClientGoalRequest(clientId, input)
    await refreshData()
  }, [refreshData])

  const updateGoal = useCallback(async (clientId: string, goalId: string, input: FinancialGoalUpdate) => {
    await updateClientGoalRequest(clientId, goalId, input)
    await refreshData()
  }, [refreshData])

  const deleteGoal = useCallback(async (clientId: string, goalId: string) => {
    await deleteClientGoalRequest(clientId, goalId)
    await refreshData()
  }, [refreshData])

  const updateDraft = useCallback((draftId: string, status: SessionDraftStatus) => {
    setSessionDrafts((current) => current.map((item) => getDraftId(item.record) === draftId ? { ...item, status } : item))
  }, [])

  const createDraft = useCallback(async (input: RecommendationDraftInput) => {
    const record = await createAdviserDraftRequest(input)
    setSessionDrafts((current) => [{ record, status: 'created' }, ...current])
    await auditQuery.mutate()
    return record
  }, [auditQuery.mutate])

  const submitDraft = useCallback(async (draftId: string) => {
    await submitAdviserDraftRequest(draftId)
    updateDraft(draftId, 'submitted')
    await auditQuery.mutate()
  }, [auditQuery.mutate, updateDraft])

  const decideDraft = useCallback(async (
    draftId: string,
    decision: 'approve' | 'reject',
    reason: string,
    adviserId: string,
  ) => {
    await decideAdviserDraftRequest(draftId, {
      adviser_id: adviserId,
      decision,
      reason,
    })
    updateDraft(draftId, decision === 'approve' ? 'approved' : 'rejected')
    await auditQuery.mutate()
  }, [auditQuery.mutate, updateDraft])

  const value = useMemo<FinPilotContextValue>(() => ({
    apiStatus,
    apiBaseUrl: API_BASE_URL,
    healthError: asError(healthQuery.error),
    clients: clientsQuery.data ?? [],
    clientsLoading: clientsQuery.isLoading,
    clientsError: asError(clientsQuery.error),
    auditEntries: auditQuery.data ?? [],
    auditLoading: auditQuery.isLoading,
    auditError: asError(auditQuery.error),
    researchStatus: researchQuery.data,
    researchStatusLoading: researchQuery.isLoading,
    researchStatusError: asError(researchQuery.error),
    sessionDrafts,
    refreshClients,
    refreshAuditLog,
    createClient,
    updateClient,
    deleteClient,
    saveClientGoal,
    updateGoal,
    deleteGoal,
    createDraft,
    submitDraft,
    decideDraft,
  }), [
    apiStatus,
    healthQuery.error,
    clientsQuery.data,
    clientsQuery.isLoading,
    clientsQuery.error,
    auditQuery.data,
    auditQuery.isLoading,
    auditQuery.error,
    researchQuery.data,
    researchQuery.isLoading,
    researchQuery.error,
    sessionDrafts,
    refreshClients,
    refreshAuditLog,
    createClient,
    updateClient,
    deleteClient,
    saveClientGoal,
    updateGoal,
    deleteGoal,
    createDraft,
    submitDraft,
    decideDraft,
  ])

  return <FinPilotContext.Provider value={value}>{children}</FinPilotContext.Provider>
}

export function useFinPilot() {
  const context = useContext(FinPilotContext)
  if (!context) throw new Error('useFinPilot must be used inside FinPilotProvider.')
  return context
}
