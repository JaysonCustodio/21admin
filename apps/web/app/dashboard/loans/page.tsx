import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { CASH_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { AccessRestricted } from "../access-restricted";
import { LoansPanel } from "./loans-panel";

export default async function LoansPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "loans")) {
    return <ModuleLocked module="Loans" />;
  }

  return (
    <div>
      <PageHeader title="Loans" description="Issue and track employee loans." />
      {hasRole(session.role, CASH_MANAGERS) ? (
        <LoansPanel defaultCurrency={session.company.defaultCurrency} />
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
}
