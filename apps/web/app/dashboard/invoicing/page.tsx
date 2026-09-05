import { Receipt } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { ComingSoon } from "@/components/ui/coming-soon";

export default async function InvoicingPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "invoicing")) {
    return <ModuleLocked module="Invoicing" />;
  }

  return (
    <div>
      <PageHeader title="Invoicing" description="Create and send customer invoices." />
      <ComingSoon
        title="Invoicing is on its way"
        description="Create invoices, track payment status, and manage customers — this module is still being built."
        icon={Receipt}
      />
    </div>
  );
}
