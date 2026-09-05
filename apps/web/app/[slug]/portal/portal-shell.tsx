"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { ModuleKey, UserRole } from "@business-platform/shared-types";
import { useSidebarToggle } from "@/lib/use-sidebar-toggle";
import { SidebarBackdrop } from "@/components/ui/sidebar-toggle-button";
import { PortalSidebar } from "./portal-sidebar";
import { PortalTopbar } from "./portal-topbar";

export function PortalShell({
  slug,
  companyName,
  logoUrl,
  modules,
  role,
  fullName,
  profileImageUrl,
  children,
}: {
  slug: string;
  companyName: string;
  logoUrl: string | null;
  modules: ModuleKey[];
  role: UserRole;
  fullName: string;
  profileImageUrl: string | null;
  children: ReactNode;
}) {
  const { open, toggle, close } = useSidebarToggle("portal-sidebar-open");
  const pathname = usePathname();

  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <SidebarBackdrop open={open} onClick={close} />
      <PortalSidebar
        slug={slug}
        companyName={companyName}
        logoUrl={logoUrl}
        modules={modules}
        role={role}
        open={open}
        onClose={close}
      />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <PortalTopbar slug={slug} fullName={fullName} profileImageUrl={profileImageUrl} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-x-hidden bg-slate-50 p-4 dark:bg-slate-900 sm:p-6 md:overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
