import { API_BASE_URL } from "./api-client";

export interface PortalBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  fundName?: string;
}

export async function getPortalBranding(slug: string): Promise<PortalBranding | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/portal/${slug}/branding`, { cache: "no-store" });
    if (res.ok) return (await res.json()) as PortalBranding;
  } catch {
    // fall through to fund lookup
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/funds/${slug}/branding`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PortalBranding;
  } catch {
    return null;
  }
}
