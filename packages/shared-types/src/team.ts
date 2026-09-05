export const ALL_USER_ROLES = ["OWNER", "ADMIN", "HR_MANAGER", "HR_ASSISTANT", "TREASURER", "MEMBER"] as const;

export type UserRole = (typeof ALL_USER_ROLES)[number];

// roles that appear on the Team page — MEMBER (employee-portal-only) is
// managed from the Employees directory instead
export const TEAM_ROLES = ["OWNER", "ADMIN", "HR_MANAGER", "HR_ASSISTANT", "TREASURER"] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

// roles the Owner/Admin can assign when inviting or editing a team member —
// OWNER itself is fixed at company creation and can't be reassigned
export const ASSIGNABLE_TEAM_ROLES = ["ADMIN", "HR_MANAGER", "HR_ASSISTANT", "TREASURER"] as const;

export type AssignableTeamRole = (typeof ASSIGNABLE_TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  HR_ASSISTANT: "HR Assistant",
  TREASURER: "Treasurer",
};

export const TEAM_ROLE_DESCRIPTIONS: Record<AssignableTeamRole, string> = {
  ADMIN: "Full operational access — company settings, team, employees, loans, sinking funds, and inventory. No billing, payroll, or invoicing.",
  HR_MANAGER: "Manages the employee directory, attendance, and runs payroll.",
  HR_ASSISTANT: "Manages the employee directory and attendance, without access to salary or bank details.",
  TREASURER: "Manages loans, sinking funds, and invoicing.",
};

// exactly mirrors the server-side role groups in apps/api/src/lib/roles.ts —
// keep both in sync when a role's access changes
export const TEAM_ROLE_ACCESS: Record<TeamRole, string[]> = {
  OWNER: ["Full access"],
  ADMIN: ["Company Settings", "Team", "Employees", "Attendance", "Loans", "Sinking Funds", "Inventory"],
  HR_MANAGER: ["Employees", "Attendance", "Payroll"],
  HR_ASSISTANT: ["Employees (no salary/bank)", "Attendance"],
  TREASURER: ["Loans", "Sinking Funds", "Invoicing"],
};

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: TeamRole;
  mustChangePassword: boolean;
  createdAt: string;
}
