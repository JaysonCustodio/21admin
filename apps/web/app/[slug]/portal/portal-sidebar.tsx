"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { API_BASE_URL } from "@/lib/api-client";
import { PORTAL_NAV_ITEMS } from "./portal-nav-config";

function linkClasses(isActive: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-primary text-white"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
  }`;
}

export function PortalSidebar({
  slug,
  companyName,
  logoUrl,
  modules,
  role,
}: {
  slug: string;
  companyName: string;
  logoUrl: string | null;
  modules: ModuleKey[];
  role: UserRole;
}) {
  const pathname = usePathname();
  const items = PORTAL_NAV_ITEMS.filter((item) => !item.module || modules.includes(item.module));
  const hasDashboardAccess = role !== "MEMBER";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:h-screen md:min-h-0">
      <div className="flex shrink-0 select-none items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${API_BASE_URL}${logoUrl}`} alt={companyName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <Image src="/21admin-logo.png" alt="21 Admin" width={32} height={32} className="rounded-lg" />
        )}
        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{companyName}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const href = item.href(slug);
          const Icon = item.icon;
          return (
            <Link key={href} href={href} className={linkClasses(pathname === href)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {hasDashboardAccess && (
        <div className="shrink-0 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
          <Link href="/dashboard" className={linkClasses(false)}>
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      )}
    </aside>
  );
}
