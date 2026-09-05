import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  // MEMBER is the only role with no dashboard access at all — someone with
  // both an employee record AND a staff role (e.g. HR Manager) keeps full
  // access to their assigned role's dashboard sections, not just the portal
  if (session.role === "MEMBER") {
    redirect(session.company.slug ? `/${session.company.slug}/portal` : "/login");
  }
  if (session.mustChangePassword) {
    redirect(session.company.slug ? `/${session.company.slug}/change-password` : "/login");
  }

  const themeStyle = session.company.primaryColor
    ? ({ "--color-primary": session.company.primaryColor } as CSSProperties)
    : undefined;

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden" style={themeStyle}>
      <DashboardShell
        companyId={session.company.id}
        companyName={session.company.name}
        companySlug={session.company.slug}
        logoUrl={session.company.logoUrl}
        modules={session.modules}
        role={session.role}
        isEmployee={session.isEmployee}
        fullName={session.user.fullName}
        email={session.user.email}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
