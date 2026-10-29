import type {
  AuditEntry,
  EvidenceItem,
  Investor,
  NewInvestorInput,
  ProposalStatus,
  RiskAssessmentSnapshot,
} from '@/lib/finpilot-data'

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

export type ResearchReply = {
  answer: string
  evidence: EvidenceItem[]
  insufficientEvidence: boolean
  sourceLabel: string
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('No API base URL is configured.')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`The API request failed (${response.status}).`)
  }

  return response.json() as Promise<T>
}

export async function createInvestor(input: NewInvestorInput): Promise<Investor> {
  if (API_BASE_URL) {
    return requestJson<Investor>('/investors', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  return {
    id: `INV-DEMO-${Date.now().toString().slice(-4)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    age: input.age,
    financialGoals: [input.financialGoal],
    riskCapacity: input.riskCapacity,
    riskTolerance: input.riskTolerance,
    status: 'Onboarding',
    lastUpdated: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    occupation: 'Not provided',
    location: 'Not provided',
  }
}

export async function saveInvestorRiskAssessment(
  investorId: string,
  assessment: RiskAssessmentSnapshot,
): Promise<void> {
  if (API_BASE_URL) {
    await requestJson<unknown>(
      `/investors/${encodeURIComponent(investorId)}/risk-assessment`,
      {
        method: 'PUT',
        body: JSON.stringify(assessment),
      },
    )
  }
}

export async function updateProposalReview(
  proposalId: string,
  status: ProposalStatus,
  note?: string,
): Promise<{ status: ProposalStatus }> {
  if (API_BASE_URL) {
    return requestJson<{ status: ProposalStatus }>(
      `/proposals/${encodeURIComponent(proposalId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ status, note }),
      },
    )
  }

  return { status }
}

export async function answerFundResearchQuestion(
  question: string,
): Promise<ResearchReply> {
  if (API_BASE_URL) {
    const reply = await requestJson<ResearchReply>('/research/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })

    if (!Array.isArray(reply.evidence) || reply.evidence.length === 0) {
      return {
        ...reply,
        answer: 'Insufficient evidence in the available documents.',
        evidence: [],
        insufficientEvidence: true,
        sourceLabel: reply.sourceLabel || 'No supporting evidence returned',
      }
    }

    return reply
  }

  const objectiveEvidence: EvidenceItem = {
    documentName: 'Sample Scheme Information Document · DEMO',
    page: 12,
    section: 'Investment objective',
    excerpt:
      'Fictional demonstration excerpt: the sample scheme seeks long-term capital appreciation through investments in equity and equity-related instruments. This text is synthetic and is not a real scheme disclosure.',
  }
  const asksAboutObjective =
    /objective|stated purpose|investment purpose|mandate/i.test(question)

  if (asksAboutObjective) {
    return {
      answer:
        'The fictional sample excerpt describes a long-term capital appreciation objective. This summary is limited to the demonstration text shown below and is not a verified fund disclosure.',
      evidence: [objectiveEvidence],
      insufficientEvidence: false,
      sourceLabel: 'Fictional sample document · DEMO',
    }
  }

  return {
    answer: 'Insufficient evidence in the available documents.',
    evidence: [],
    insufficientEvidence: true,
    sourceLabel: 'No matching source in the demo document set',
  }
}

export function createAuditEntry(
  action: string,
  recordId: string,
  description: string,
): AuditEntry {
  return {
    id: `AUD-DEMO-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    recordId,
    actor: 'Demo Adviser',
    description,
  }
}
