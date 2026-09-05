"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { useSidebarToggle } from "@/lib/use-sidebar-toggle";
import { SidebarBackdrop } from "@/components/ui/sidebar-toggle-button";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  companyId,
  companyName,
  companySlug,
  logoUrl,
  modules,
  role,
  isEmployee,
  fullName,
  email,
  children,
}: {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  logoUrl: string | null;
  modules: ModuleKey[];
  role: UserRole;
  isEmployee: boolean;
  fullName: string;
  email: string;
  children: ReactNode;
}) {
  const { open, toggle, close } = useSidebarToggle("dashboard-sidebar-open");
  const pathname = usePathname();

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <SidebarBackdrop open={open} onClick={close} />
      <Sidebar
        companyId={companyId}
        companyName={companyName}
        companySlug={companySlug}
        logoUrl={logoUrl}
        modules={modules}
        role={role}
        isEmployee={isEmployee}
        open={open}
        onClose={close}
      />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <Topbar fullName={fullName} email={email} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-x-hidden bg-slate-50 p-4 dark:bg-slate-900 sm:p-6 md:overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
