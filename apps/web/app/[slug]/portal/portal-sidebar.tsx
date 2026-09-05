"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, X } from "lucide-react";
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
  open,
  onClose,
}: {
  slug: string;
  companyName: string;
  logoUrl: string | null;
  modules: ModuleKey[];
  role: UserRole;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = PORTAL_NAV_ITEMS.filter((item) => !item.module || modules.includes(item.module));
  const hasDashboardAccess = role !== "MEMBER";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-700 dark:bg-slate-800 md:static md:z-auto md:h-screen md:min-h-0 md:translate-x-0 md:transition-[width] ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${open ? "md:w-64" : "md:w-0 md:overflow-hidden md:border-r-0"}`}
    >
      <div className="flex shrink-0 select-none items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${API_BASE_URL}${logoUrl}`} alt={companyName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <Image src="/21admin-logo.png" alt="21 Admin" width={32} height={32} className="rounded-lg" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {companyName}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const href = item.href(slug);
          const Icon = item.icon;
          return (
            <Link key={href} href={href} onClick={onClose} className={linkClasses(pathname === href)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {hasDashboardAccess && (
        <div className="shrink-0 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
          <Link href="/dashboard" onClick={onClose} className={linkClasses(false)}>
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      )}
    </aside>
  );
}
