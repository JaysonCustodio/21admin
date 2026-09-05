export const SINKING_FUND_FREQUENCIES = ["WEEKLY", "SEMI_MONTHLY", "MONTHLY"] as const;

export type SinkingFundFrequency = (typeof SINKING_FUND_FREQUENCIES)[number];

export interface SinkingFundContribution {
  id: string;
  memberId: string;
  dueDate: string;
  amount: string;
  paid: boolean;
  paidAt: string | null;
}

export interface SinkingFundMember {
  id: string;
  sinkingFundId: string;
  employeeId: string | null;
  manualName: string | null;
  manualMobile: string | null;
  manualEmail: string | null;
  memberCode: string;
  mustChangePassword: boolean;
  createdAt: string;
  employee: {
    fullName: string;
    employeeCode: string;
  } | null;
  contributions: SinkingFundContribution[];
}

export interface SinkingFund {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  frequency: SinkingFundFrequency;
  amountPerMember: string;
  startDate: string;
  releaseDate: string;
  qrCodeUrl: string | null;
  createdAt: string;
}

export interface SinkingFundWithMembers extends SinkingFund {
  members: SinkingFundMember[];
}

export interface SinkingFundMemberPortalCredentials {
  memberCode: string;
  temporaryPassword: string;
  portalUrl: string;
}

// what a logged-in fund member sees of themselves via /api/funds/me
export interface FundMemberSession {
  member: {
    id: string;
    fullName: string;
    memberCode: string;
    mustChangePassword: boolean;
  };
  fund: SinkingFund;
  company: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    defaultCurrency: string;
  };
  totalPaid: number;
  nextContribution: SinkingFundContribution | null;
  contributions: SinkingFundContribution[];
}
