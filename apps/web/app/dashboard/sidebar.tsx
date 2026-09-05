"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Building2, UserCog, UserRound } from "lucide-react";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { API_BASE_URL } from "@/lib/api-client";
import { TEAM_MANAGERS, hasRole } from "@/lib/roles";
import { NAV_ITEMS } from "./nav-config";
import { CompanySwitcher } from "./company-switcher";

const BILLING_HREF = "/dashboard/settings/billing";
const COMPANY_HREF = "/dashboard/settings/company";
const TEAM_HREF = "/dashboard/settings/team";

function linkClasses(isActive: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-primary text-white"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
  }`;
}

export function Sidebar({
  companyId,
  companyName,
  companySlug,
  logoUrl,
  modules,
  role,
  isEmployee,
}: {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  logoUrl: string | null;
  modules: ModuleKey[];
  role: UserRole;
  isEmployee: boolean;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => (!item.module || modules.includes(item.module)) && (!item.roles || item.roles.includes(role))
  );
  // only the account creator can create/switch companies — everyone else
  // (Admin, HR, Treasurer, or an employee who also holds one of those roles)
  // gets a plain header instead
  const isOwner = role === "OWNER";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:h-screen md:min-h-0">
      <div className="shrink-0 border-b border-slate-200 px-3 py-3 dark:border-slate-700">
        {isOwner ? (
          <CompanySwitcher current={{ id: companyId, name: companyName, logoUrl }} />
        ) : (
          <div className="flex items-center gap-2 px-2 py-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_BASE_URL}${logoUrl}`} alt={companyName} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <Image src="/21admin-logo.png" alt="21 Admin" width={32} height={32} className="rounded-lg" />
            )}
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{companyName}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={linkClasses(pathname === item.href)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
        {isEmployee && companySlug && (
          <Link href={`/${companySlug}/portal`} className={linkClasses(false)}>
            <UserRound className="h-4 w-4" />
            My Portal
          </Link>
        )}
        {hasRole(role, TEAM_MANAGERS) && (
          <>
            <Link href={COMPANY_HREF} className={linkClasses(pathname === COMPANY_HREF)}>
              <Building2 className="h-4 w-4" />
              Company
            </Link>
            <Link href={TEAM_HREF} className={linkClasses(pathname === TEAM_HREF)}>
              <UserCog className="h-4 w-4" />
              Team
            </Link>
          </>
        )}
        <Link href={BILLING_HREF} className={linkClasses(pathname === BILLING_HREF)}>
          <Settings className="h-4 w-4" />
          Settings & Billing
        </Link>
      </div>
    </aside>
  );
}
