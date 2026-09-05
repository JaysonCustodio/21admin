import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

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
      <Sidebar
        companyId={session.company.id}
        companyName={session.company.name}
        companySlug={session.company.slug}
        logoUrl={session.company.logoUrl}
        modules={session.modules}
        role={session.role}
        isEmployee={session.isEmployee}
      />
      <div className="flex flex-1 flex-col md:min-h-0">
        <Topbar fullName={session.user.fullName} email={session.user.email} />
        <main className="flex-1 bg-slate-50 p-6 dark:bg-slate-900 md:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
