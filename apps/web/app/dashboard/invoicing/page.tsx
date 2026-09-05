import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { RECEIVABLES_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { AccessRestricted } from "../access-restricted";
import { InvoicingPanel } from "./invoicing-panel";

export default async function InvoicingPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "invoicing")) {
    return <ModuleLocked module="Invoicing" />;
  }

  return (
    <div>
      <PageHeader title="Invoicing" description="Create and send customer invoices." />
      {hasRole(session.role, RECEIVABLES_MANAGERS) ? (
        <InvoicingPanel defaultCurrency={session.company.defaultCurrency} />
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
}
