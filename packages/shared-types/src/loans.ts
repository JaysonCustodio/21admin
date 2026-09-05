export const LOAN_STATUSES = ["ACTIVE", "PAID_OFF", "DEFAULTED"] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LOAN_FUND_SOURCES = ["PERSONAL", "SINKING_FUND"] as const;

export type LoanFundSource = (typeof LOAN_FUND_SOURCES)[number];

export const LOAN_BORROWER_TYPES = ["EMPLOYEE", "FUND_MEMBER", "MANUAL"] as const;

export type LoanBorrowerType = (typeof LOAN_BORROWER_TYPES)[number];

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: string;
  paidAt: string;
}

export interface Loan {
  id: string;
  companyId: string;
  fundSource: LoanFundSource;
  sinkingFundId: string | null;
  employeeId: string | null;
  sinkingFundMemberId: string | null;
  manualBorrowerName: string | null;
  principal: string;
  interestRate: string;
  termMonths: number;
  status: LoanStatus;
  createdAt: string;
}

export interface LoanWithDetails extends Loan {
  employee: {
    fullName: string;
    employeeCode: string;
  } | null;
  sinkingFundMember: {
    memberCode: string;
    manualName: string | null;
    employee: { fullName: string } | null;
  } | null;
  sinkingFund: {
    name: string;
    slug: string;
  } | null;
  repayments: LoanRepayment[];
}
