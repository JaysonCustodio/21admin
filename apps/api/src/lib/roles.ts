import type { UserRole } from "@business-platform/db";

// company settings + team management
export const TEAM_MANAGERS: UserRole[] = ["OWNER", "ADMIN"];

// employee directory + attendance log
export const EMPLOYEE_MANAGERS: UserRole[] = ["OWNER", "ADMIN", "HR_MANAGER", "HR_ASSISTANT"];

// fields HR_ASSISTANT is not allowed to set on an employee record
export const EMPLOYEE_SENSITIVE_FIELDS = [
  "baseSalary",
  "baseSalaryCurrency",
  "bankName",
  "bankAccountNumber",
  "bankAccountHolderName",
] as const;

// running payroll / viewing all payslips
export const PAYROLL_MANAGERS: UserRole[] = ["OWNER", "HR_MANAGER"];

// loans, sinking funds — cash management the Treasurer owns, Admin can still touch
export const CASH_MANAGERS: UserRole[] = ["OWNER", "ADMIN", "TREASURER"];

// invoicing (receivables) — explicitly excludes Admin, Treasurer owns this with the Owner
export const RECEIVABLES_MANAGERS: UserRole[] = ["OWNER", "TREASURER"];

// inventory — operational stock, not cash; Treasurer doesn't need it
export const INVENTORY_MANAGERS: UserRole[] = ["OWNER", "ADMIN"];

// billing, multi-company management — reserved for the account creator
export const OWNER_ONLY: UserRole[] = ["OWNER"];

// every role with dashboard access (everyone but MEMBER) — for lightweight,
// non-sensitive lookups shared across modules (e.g. picking an employee for a loan)
export const ALL_STAFF: UserRole[] = ["OWNER", "ADMIN", "HR_MANAGER", "HR_ASSISTANT", "TREASURER"];
