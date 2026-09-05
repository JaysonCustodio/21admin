import { LayoutDashboard, Users, Wallet, HandCoins, PiggyBank, Boxes, Receipt, type LucideIcon } from "lucide-react";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { EMPLOYEE_MANAGERS, PAYROLL_MANAGERS, CASH_MANAGERS, INVENTORY_MANAGERS, RECEIVABLES_MANAGERS } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  details?: string[];
  icon: LucideIcon;
  module?: ModuleKey;
  roles?: UserRole[];
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Your dashboard at a glance.",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/employees",
    label: "Employees",
    description: "Manage your employee directory.",
    details: ["Employee profiles, bank details, and documents", "Attendance and shift schedules", "Employee self-service portal"],
    icon: Users,
    module: "employees",
    roles: EMPLOYEE_MANAGERS,
  },
  {
    href: "/dashboard/payroll",
    label: "Payroll",
    description: "Run payroll and manage payslips.",
    details: ["Run payroll by pay period", "Auto-calculated deductions", "Payslips available in the employee portal"],
    icon: Wallet,
    module: "payroll",
    roles: PAYROLL_MANAGERS,
  },
  {
    href: "/dashboard/loans",
    label: "Loans",
    description: "Issue and track employee loans.",
    details: ["Fund from company cash or a sinking fund", "Interest, term, and repayment tracking", "Loan to employees, fund members, or manual entries"],
    icon: HandCoins,
    module: "loans",
    roles: CASH_MANAGERS,
  },
  {
    href: "/dashboard/sinking-funds",
    label: "Sinking Funds",
    description: "Save toward upcoming company expenses.",
    details: ["Recurring per-member contribution tracking", "Dedicated member login portal with QR payments", "Advance payments and payment history"],
    icon: PiggyBank,
    module: "sinking-funds",
    roles: CASH_MANAGERS,
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    description: "Keep stock levels up to date.",
    details: ["Track stock levels by SKU", "Low-stock alerts", "Purchase and usage history"],
    icon: Boxes,
    module: "inventory",
    roles: INVENTORY_MANAGERS,
    comingSoon: true,
  },
  {
    href: "/dashboard/invoicing",
    label: "Invoicing",
    description: "Create and send customer invoices.",
    details: ["Create and send customer invoices", "Track paid, sent, and overdue status", "Customer directory"],
    icon: Receipt,
    module: "invoicing",
    roles: RECEIVABLES_MANAGERS,
    comingSoon: true,
  },
];
