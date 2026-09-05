export const PAYROLL_RUN_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export interface PayrollRun {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  grossPay: string;
  deductions: string;
  netPay: string;
  createdAt: string;
}

export interface PayslipWithRun extends Payslip {
  payrollRun: PayrollRun;
}

export interface PayslipWithEmployee extends Payslip {
  employee: {
    fullName: string;
    employeeCode: string;
  };
}

export interface PayrollRunWithPayslips extends PayrollRun {
  payslips: PayslipWithEmployee[];
}
