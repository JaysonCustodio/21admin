import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { CASH_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { AccessRestricted } from "../access-restricted";
import { SinkingFundsPanel } from "./sinking-funds-panel";

export default async function SinkingFundsPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "sinking-funds")) {
    return <ModuleLocked module="Sinking Funds" />;
  }

  return (
    <div>
      <PageHeader title="Sinking Funds" description="Save toward upcoming company expenses." />
      {hasRole(session.role, CASH_MANAGERS) ? (
        <SinkingFundsPanel defaultCurrency={session.company.defaultCurrency} />
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
}
