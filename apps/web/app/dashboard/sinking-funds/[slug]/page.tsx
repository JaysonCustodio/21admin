import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { CASH_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { API_BASE_URL } from "@/lib/api-client";
import { ModuleLocked } from "../../module-locked";
import { AccessRestricted } from "../../access-restricted";
import { FundDetailPanel } from "./fund-detail-panel";

async function getFundName(slug: string): Promise<string | null> {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/sinking-funds/by-slug/${slug}`, {
      headers: { Cookie: `session=${sessionCookie.value}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { fund: { name: string } };
    return data.fund.name;
  } catch {
    return null;
  }
}

export default async function SinkingFundDetailPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "sinking-funds")) {
    return <ModuleLocked module="Sinking Funds" />;
  }

  const fundName = await getFundName(params.slug);

  return (
    <div>
      <PageHeader
        title={fundName ?? "Sinking Fund"}
        description="Track contributions, periods, and members for this fund."
      />
      {hasRole(session.role, CASH_MANAGERS) ? (
        <FundDetailPanel
          slug={params.slug}
          defaultCurrency={session.company.defaultCurrency}
          isBusinessAccount={session.company.accountType !== "PERSONAL"}
        />
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
}
