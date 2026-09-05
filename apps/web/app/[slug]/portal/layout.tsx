import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFundSession } from "@/lib/fund-auth";
import { PortalShell } from "./portal-shell";
import { FundPortalView } from "./fund-portal-view";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const fundSession = await getFundSession();
  if (fundSession && fundSession.fund.slug === params.slug) {
    if (fundSession.member.mustChangePassword) {
      redirect(`/${params.slug}/change-password`);
    }
    return <FundPortalView slug={params.slug} session={fundSession} />;
  }

  const session = await getSession();

  if (!session || session.company.slug !== params.slug || !session.isEmployee) {
    redirect(`/${params.slug}/login`);
  }

  if (session.mustChangePassword) {
    redirect(`/${params.slug}/change-password`);
  }

  const themeStyle = session.company.primaryColor
    ? ({ "--color-primary": session.company.primaryColor } as CSSProperties)
    : undefined;

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden" style={themeStyle}>
      <PortalShell
        slug={params.slug}
        companyName={session.company.name}
        logoUrl={session.company.logoUrl}
        modules={session.modules}
        role={session.role}
        fullName={session.user.fullName}
        profileImageUrl={session.employee?.profileImageUrl ?? null}
      >
        {children}
      </PortalShell>
    </div>
  );
}
