'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEMO_AUDIT_TRAIL,
  DEMO_INVESTORS,
  DEMO_PROPOSALS,
  type AuditEntry,
  type Investor,
  type NewInvestorInput,
  type Proposal,
  type ProposalStatus,
  type RiskAssessmentSnapshot,
} from '@/lib/finpilot-data'
import {
  createAuditEntry,
  createInvestor as createInvestorRequest,
  saveInvestorRiskAssessment,
  updateProposalReview,
} from '@/lib/finpilot-service'

type FinPilotContextValue = {
  investors: Investor[]
  proposals: Proposal[]
  auditEntries: AuditEntry[]
  addInvestor: (input: NewInvestorInput) => Promise<Investor>
  saveRiskAssessment: (investorId: string, assessment: RiskAssessmentSnapshot) => Promise<void>
  reviewProposal: (
    proposalId: string,
    status: ProposalStatus,
    note?: string,
  ) => Promise<void>
}

const FinPilotContext = createContext<FinPilotContextValue | null>(null)

export function FinPilotProvider({ children }: { children: ReactNode }) {
  const [investors, setInvestors] = useState(DEMO_INVESTORS)
  const [proposals, setProposals] = useState(DEMO_PROPOSALS)
  const [auditEntries, setAuditEntries] = useState(DEMO_AUDIT_TRAIL)

  const addInvestor = async (input: NewInvestorInput) => {
    const investor = await createInvestorRequest(input)
    setInvestors((current) => [investor, ...current])
    setAuditEntries((current) => [
      createAuditEntry(
        'Investor profile created',
        investor.id,
        `Created a demo investor profile for ${investor.name}.`,
      ),
      ...current,
    ])
    return investor
  }

  const saveRiskAssessment = async (
    investorId: string,
    assessment: RiskAssessmentSnapshot,
  ) => {
    await saveInvestorRiskAssessment(investorId, assessment)
    setInvestors((current) =>
      current.map((investor) =>
        investor.id === investorId
          ? {
              ...investor,
              riskCapacity: assessment.riskCapacity,
              riskTolerance: assessment.riskTolerance,
              lastUpdated: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
            }
          : investor,
      ),
    )
    setAuditEntries((current) => [
      createAuditEntry(
        'Risk assessment updated',
        investorId,
        'Updated the separate demo risk capacity and tolerance fields.',
      ),
      ...current,
    ])
  }

  const reviewProposal = async (
    proposalId: string,
    status: ProposalStatus,
    note?: string,
  ) => {
    const result = await updateProposalReview(proposalId, status, note)
    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === proposalId
          ? { ...proposal, status: result.status }
          : proposal,
      ),
    )

    const actionByStatus: Record<ProposalStatus, string> = {
      'Pending review': 'Review reopened',
      Approved: 'Review approved',
      Rejected: 'Review rejected',
      'Changes requested': 'Changes requested',
    }
    setAuditEntries((current) => [
      createAuditEntry(
        actionByStatus[result.status],
        proposalId,
        note || `Demo proposal status changed to ${result.status.toLowerCase()}.`,
      ),
      ...current,
    ])
  }

  const value = useMemo(
    () => ({
      investors,
      proposals,
      auditEntries,
      addInvestor,
      saveRiskAssessment,
      reviewProposal,
    }),
    [investors, proposals, auditEntries],
  )

  return <FinPilotContext.Provider value={value}>{children}</FinPilotContext.Provider>
}

export function useFinPilot() {
  const context = useContext(FinPilotContext)
  if (!context) {
    throw new Error('useFinPilot must be used inside FinPilotProvider.')
  }
  return context
}
