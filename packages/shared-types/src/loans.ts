export const LOAN_STATUSES = ["ACTIVE", "PAID_OFF", "DEFAULTED"] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: string;
  paidAt: string;
}

export interface Loan {
  id: string;
  companyId: string;
  employeeId: string;
  principal: string;
  termMonths: number;
  status: LoanStatus;
  createdAt: string;
}

export interface LoanWithDetails extends Loan {
  employee: {
    fullName: string;
    employeeCode: string;
  };
  repayments: LoanRepayment[];
}
