import { LayoutDashboard, Users, Wallet, HandCoins, PiggyBank, Boxes, Receipt, type LucideIcon } from "lucide-react";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { EMPLOYEE_MANAGERS, PAYROLL_MANAGERS, CASH_MANAGERS, INVENTORY_MANAGERS, RECEIVABLES_MANAGERS } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  module?: ModuleKey;
  roles?: UserRole[];
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
    icon: Users,
    module: "employees",
    roles: EMPLOYEE_MANAGERS,
  },
  {
    href: "/dashboard/payroll",
    label: "Payroll",
    description: "Run payroll and manage payslips.",
    icon: Wallet,
    module: "payroll",
    roles: PAYROLL_MANAGERS,
  },
  {
    href: "/dashboard/loans",
    label: "Loans",
    description: "Issue and track employee loans.",
    icon: HandCoins,
    module: "loans",
    roles: CASH_MANAGERS,
  },
  {
    href: "/dashboard/sinking-funds",
    label: "Sinking Funds",
    description: "Save toward upcoming company expenses.",
    icon: PiggyBank,
    module: "sinking-funds",
    roles: CASH_MANAGERS,
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    description: "Keep stock levels up to date.",
    icon: Boxes,
    module: "inventory",
    roles: INVENTORY_MANAGERS,
  },
  {
    href: "/dashboard/invoicing",
    label: "Invoicing",
    description: "Create and send customer invoices.",
    icon: Receipt,
    module: "invoicing",
    roles: RECEIVABLES_MANAGERS,
  },
];
