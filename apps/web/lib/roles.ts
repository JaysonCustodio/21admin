import type { UserRole } from "@business-platform/shared-types";

// company settings + team management
export const TEAM_MANAGERS: UserRole[] = ["OWNER", "ADMIN"];

// employee directory + attendance log
export const EMPLOYEE_MANAGERS: UserRole[] = ["OWNER", "ADMIN", "HR_MANAGER", "HR_ASSISTANT"];

// running payroll / viewing all payslips
export const PAYROLL_MANAGERS: UserRole[] = ["OWNER", "HR_MANAGER"];

// loans, sinking funds — cash management the Treasurer owns, Admin can still touch
export const CASH_MANAGERS: UserRole[] = ["OWNER", "ADMIN", "TREASURER"];

// invoicing (receivables) — excludes Admin, Treasurer owns this with the Owner
export const RECEIVABLES_MANAGERS: UserRole[] = ["OWNER", "TREASURER"];

// inventory — operational stock, not cash
export const INVENTORY_MANAGERS: UserRole[] = ["OWNER", "ADMIN"];

// billing, multi-company management — reserved for the account creator
export const OWNER_ONLY: UserRole[] = ["OWNER"];

export function hasRole(role: UserRole | undefined, allowed: UserRole[]): boolean {
  return !!role && allowed.includes(role);
}
