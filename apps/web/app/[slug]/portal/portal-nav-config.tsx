import { LayoutDashboard, Clock, Receipt, UserRound, type LucideIcon } from "lucide-react";
import type { ModuleKey } from "@business-platform/shared-types";

export interface PortalNavItem {
  href: (slug: string) => string;
  label: string;
  icon: LucideIcon;
  module?: ModuleKey;
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  {
    href: (slug) => `/${slug}/portal`,
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: (slug) => `/${slug}/portal/attendance`,
    label: "Attendance",
    icon: Clock,
  },
  {
    href: (slug) => `/${slug}/portal/payslips`,
    label: "Payslips",
    icon: Receipt,
    module: "payroll",
  },
  {
    href: (slug) => `/${slug}/portal/profile`,
    label: "Profile",
    icon: UserRound,
  },
];
