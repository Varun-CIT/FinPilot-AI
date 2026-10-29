export type RiskLevel = 'Low' | 'Moderate' | 'High'
export type InvestorStatus = 'Active' | 'Onboarding' | 'Review due'
export type ProposalStatus =
  | 'Pending review'
  | 'Approved'
  | 'Rejected'
  | 'Changes requested'

export type Investor = {
  id: string
  name: string
  email: string
  age: number
  financialGoals: string[]
  riskCapacity: RiskLevel
  riskTolerance: RiskLevel
  status: InvestorStatus
  lastUpdated: string
  occupation: string
  location: string
}

export type AllocationSlice = {
  name: string
  value: number
  color: string
}

export type EvidenceItem = {
  documentName: string
  page: number
  section: string
  excerpt: string
}

export type Proposal = {
  id: string
  investorId: string
  investorName: string
  goal: string
  horizon: string
  proposedAllocation: AllocationSlice[]
  rationale: string
  assumptions: string[]
  risks: string[]
  evidence: EvidenceItem[]
  suitability: 'Review required' | 'Potential mismatch' | 'Data incomplete'
  status: ProposalStatus
  createdAt: string
}

export type AuditEntry = {
  id: string
  timestamp: string
  action: string
  recordId: string
  actor: string
  description: string
}

export type NewInvestorInput = {
  name: string
  email: string
  age: number
  financialGoal: string
  riskCapacity: RiskLevel
  riskTolerance: RiskLevel
}

export type RiskAssessmentSnapshot = {
  monthlyIncome: number
  monthlyExpenses: number
  assets: number
  liabilities: number
  emergencySavings: number
  horizonYears: number
  questionnaire: number[]
  riskCapacity: RiskLevel
  riskTolerance: RiskLevel
}

export const DEMO_INVESTORS: Investor[] = [
  {
    id: 'INV-DEMO-0248',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.demo',
    age: 38,
    financialGoals: ['Retirement', 'Education'],
    riskCapacity: 'Moderate',
    riskTolerance: 'Moderate',
    status: 'Active',
    lastUpdated: '29 Oct 2026',
    occupation: 'Product leader',
    location: 'Bengaluru',
  },
  {
    id: 'INV-DEMO-0247',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.demo',
    age: 45,
    financialGoals: ['Home purchase', 'Wealth creation'],
    riskCapacity: 'Moderate',
    riskTolerance: 'High',
    status: 'Review due',
    lastUpdated: '28 Oct 2026',
    occupation: 'Founder',
    location: 'Mumbai',
  },
  {
    id: 'INV-DEMO-0246',
    name: 'Mira Iyer',
    email: 'mira.iyer@example.demo',
    age: 32,
    financialGoals: ['Education', 'Wealth creation'],
    riskCapacity: 'High',
    riskTolerance: 'High',
    status: 'Active',
    lastUpdated: '27 Oct 2026',
    occupation: 'Consultant',
    location: 'Chennai',
  },
  {
    id: 'INV-DEMO-0245',
    name: 'Kabir Khanna',
    email: 'kabir.khanna@example.demo',
    age: 57,
    financialGoals: ['Retirement'],
    riskCapacity: 'Low',
    riskTolerance: 'Moderate',
    status: 'Review due',
    lastUpdated: '26 Oct 2026',
    occupation: 'Architect',
    location: 'Delhi',
  },
  {
    id: 'INV-DEMO-0244',
    name: 'Tara Menon',
    email: 'tara.menon@example.demo',
    age: 41,
    financialGoals: ['Home purchase', 'Retirement'],
    riskCapacity: 'Moderate',
    riskTolerance: 'Low',
    status: 'Onboarding',
    lastUpdated: '24 Oct 2026',
    occupation: 'Physician',
    location: 'Kochi',
  },
  {
    id: 'INV-DEMO-0243',
    name: 'Dev Shah',
    email: 'dev.shah@example.demo',
    age: 29,
    financialGoals: ['Wealth creation'],
    riskCapacity: 'High',
    riskTolerance: 'Moderate',
    status: 'Active',
    lastUpdated: '22 Oct 2026',
    occupation: 'Analyst',
    location: 'Pune',
  },
  {
    id: 'INV-DEMO-0242',
    name: 'Leela Nair',
    email: 'leela.nair@example.demo',
    age: 52,
    financialGoals: ['Retirement', 'Education'],
    riskCapacity: 'Moderate',
    riskTolerance: 'Moderate',
    status: 'Active',
    lastUpdated: '20 Oct 2026',
    occupation: 'Business owner',
    location: 'Hyderabad',
  },
  {
    id: 'INV-DEMO-0241',
    name: 'Ishaan Kapoor',
    email: 'ishaan.kapoor@example.demo',
    age: 35,
    financialGoals: ['Home purchase'],
    riskCapacity: 'Low',
    riskTolerance: 'High',
    status: 'Review due',
    lastUpdated: '18 Oct 2026',
    occupation: 'Designer',
    location: 'Jaipur',
  },
]

const profileEvidence = (goal: string): EvidenceItem[] => [
  {
    documentName: 'Investor profile summary · DEMO',
    page: 1,
    section: 'Stated objective',
    excerpt: `The fictional profile records ${goal.toLowerCase()} as a stated goal. Confirm the investor's details and time horizon before any suitability assessment.`,
  },
]

export const DEMO_PROPOSALS: Proposal[] = [
  {
    id: 'PROP-DEMO-0084',
    investorId: 'INV-DEMO-0247',
    investorName: 'Rohan Mehta',
    goal: 'Home purchase',
    horizon: '5 years',
    proposedAllocation: [
      { name: 'Equity', value: 40, color: '#10B981' },
      { name: 'Fixed income', value: 45, color: '#64748B' },
      { name: 'Cash & equivalents', value: 15, color: '#F4B740' },
    ],
    rationale:
      'Illustrative draft for adviser discussion. The demo profile shows a medium-term goal and a potential difference between recorded capacity and tolerance; suitability cannot be inferred from this allocation.',
    assumptions: [
      'Profile values are fictional and have not been verified.',
      'A five-year horizon is a demo input, not an investor instruction.',
      'No product selection, returns, or market outlook is represented.',
    ],
    risks: [
      'Recorded tolerance is higher than recorded capacity; reconcile before any recommendation.',
      'A medium-term goal may be affected by market volatility and liquidity needs.',
      'The proposal is a draft and is not investment advice.',
    ],
    evidence: profileEvidence('Home purchase'),
    suitability: 'Potential mismatch',
    status: 'Pending review',
    createdAt: '29 Oct 2026, 9:42 AM',
  },
  {
    id: 'PROP-DEMO-0083',
    investorId: 'INV-DEMO-0248',
    investorName: 'Ananya Rao',
    goal: 'Retirement',
    horizon: '18 years',
    proposedAllocation: [
      { name: 'Equity', value: 55, color: '#10B981' },
      { name: 'Fixed income', value: 35, color: '#64748B' },
      { name: 'Cash & equivalents', value: 10, color: '#F4B740' },
    ],
    rationale:
      'Illustrative allocation draft for adviser review. It is not generated from verified financial records and does not establish suitability.',
    assumptions: [
      'Long-term horizon is taken from a fictional profile entry.',
      'No forecast return is used to create this illustrative split.',
      'Client circumstances and constraints require adviser validation.',
    ],
    risks: [
      'Equity exposure may result in substantial short-term fluctuations.',
      'The profile and stated objective are demo data only.',
    ],
    evidence: profileEvidence('Retirement'),
    suitability: 'Review required',
    status: 'Pending review',
    createdAt: '28 Oct 2026, 4:18 PM',
  },
  {
    id: 'PROP-DEMO-0082',
    investorId: 'INV-DEMO-0245',
    investorName: 'Kabir Khanna',
    goal: 'Retirement',
    horizon: '7 years',
    proposedAllocation: [
      { name: 'Equity', value: 25, color: '#10B981' },
      { name: 'Fixed income', value: 55, color: '#64748B' },
      { name: 'Cash & equivalents', value: 20, color: '#F4B740' },
    ],
    rationale:
      'Draft allocation shown solely to demonstrate the adviser review workflow. The values are not a recommended portfolio.',
    assumptions: [
      'A seven-year horizon is fictional and must be confirmed.',
      'The adviser should verify liquidity requirements and current obligations.',
    ],
    risks: [
      'The recorded risk capacity and tolerance are not aligned.',
      'The demo record contains no verified cash-flow statement.',
    ],
    evidence: profileEvidence('Retirement'),
    suitability: 'Potential mismatch',
    status: 'Pending review',
    createdAt: '27 Oct 2026, 11:06 AM',
  },
  {
    id: 'PROP-DEMO-0081',
    investorId: 'INV-DEMO-0246',
    investorName: 'Mira Iyer',
    goal: 'Wealth creation',
    horizon: '12 years',
    proposedAllocation: [
      { name: 'Equity', value: 60, color: '#10B981' },
      { name: 'Fixed income', value: 30, color: '#64748B' },
      { name: 'Cash & equivalents', value: 10, color: '#F4B740' },
    ],
    rationale:
      'This fictional proposal is retained as a completed workflow example, not as an approved investment recommendation.',
    assumptions: [
      'All investor and goal fields are synthetic.',
      'No return estimate or product choice is included.',
    ],
    risks: ['Illustrative allocations can lose value and are not personalized advice.'],
    evidence: profileEvidence('Wealth creation'),
    suitability: 'Review required',
    status: 'Approved',
    createdAt: '25 Oct 2026, 2:12 PM',
  },
]

export const DEMO_ALLOCATION: AllocationSlice[] = [
  { name: 'Equity', value: 48, color: '#10B981' },
  { name: 'Fixed income', value: 32, color: '#64748B' },
  { name: 'Cash', value: 12, color: '#F4B740' },
  { name: 'Other', value: 8, color: '#8B8CF6' },
]

export const DEMO_RISK_DISTRIBUTION = [
  { band: 'Low', count: 44, fill: '#94A3B8' },
  { band: 'Moderate', count: 132, fill: '#10B981' },
  { band: 'High', count: 72, fill: '#F4B740' },
]

export const DEMO_ACTIVITY = [
  {
    id: 'ACT-DEMO-1907',
    investorId: 'INV-DEMO-0248',
    investorName: 'Ananya Rao',
    action: 'Risk profile reviewed',
    timestamp: 'Today, 10:24 AM',
    status: 'Completed',
  },
  {
    id: 'ACT-DEMO-1906',
    investorId: 'INV-DEMO-0247',
    investorName: 'Rohan Mehta',
    action: 'Proposal submitted for review',
    timestamp: 'Today, 9:42 AM',
    status: 'Pending',
  },
  {
    id: 'ACT-DEMO-1905',
    investorId: 'INV-DEMO-0246',
    investorName: 'Mira Iyer',
    action: 'Goal plan updated',
    timestamp: 'Yesterday, 4:18 PM',
    status: 'Completed',
  },
  {
    id: 'ACT-DEMO-1904',
    investorId: 'INV-DEMO-0245',
    investorName: 'Kabir Khanna',
    action: 'Investor profile added',
    timestamp: 'Yesterday, 11:06 AM',
    status: 'Needs review',
  },
]

export const DEMO_AUDIT_TRAIL: AuditEntry[] = [
  {
    id: 'AUD-DEMO-0421',
    timestamp: '2026-10-29T09:42:00+05:30',
    action: 'Draft created',
    recordId: 'PROP-DEMO-0084',
    actor: 'Demo Adviser',
    description: 'Draft proposal created for the fictional home purchase goal.',
  },
  {
    id: 'AUD-DEMO-0420',
    timestamp: '2026-10-29T09:12:00+05:30',
    action: 'Risk assessment edited',
    recordId: 'INV-DEMO-0248',
    actor: 'Demo Adviser',
    description: 'Demo profile assessment fields updated for demonstration.',
  },
  {
    id: 'AUD-DEMO-0419',
    timestamp: '2026-10-28T16:18:00+05:30',
    action: 'Evidence attached',
    recordId: 'PROP-DEMO-0083',
    actor: 'Demo Adviser',
    description: 'A synthetic investor profile summary was attached as demo evidence.',
  },
  {
    id: 'AUD-DEMO-0418',
    timestamp: '2026-10-27T11:06:00+05:30',
    action: 'Draft created',
    recordId: 'PROP-DEMO-0082',
    actor: 'Demo Adviser',
    description: 'Draft proposal created using fictional profile information.',
  },
  {
    id: 'AUD-DEMO-0417',
    timestamp: '2026-10-25T14:12:00+05:30',
    action: 'Review approved',
    recordId: 'PROP-DEMO-0081',
    actor: 'Demo Adviser',
    description: 'A completed demo review state; not an investment approval.',
  },
]
