import type { CSSProperties, ReactNode } from "react";
import { CenteredCardLayout } from "@/components/ui/centered-card-layout";
import { API_BASE_URL } from "@/lib/api-client";
import { getPortalBranding } from "@/lib/portal-branding";

export default async function PortalAuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const branding = await getPortalBranding(params.slug);
  const themeStyle = branding?.primaryColor
    ? ({ "--color-primary": branding.primaryColor } as CSSProperties)
    : undefined;

  return (
    <CenteredCardLayout
      style={themeStyle}
      logoUrl={branding?.logoUrl ? `${API_BASE_URL}${branding.logoUrl}` : null}
      logoAlt={branding?.name ?? "21 Admin"}
    >
      {children}
    </CenteredCardLayout>
  );
}
