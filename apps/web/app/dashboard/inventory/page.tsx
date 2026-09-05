import { Boxes } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { ComingSoon } from "@/components/ui/coming-soon";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "inventory")) {
    return <ModuleLocked module="Inventory" />;
  }

  return (
    <div>
      <PageHeader title="Inventory" description="Keep stock levels up to date." />
      <ComingSoon
        title="Inventory is on its way"
        description="Track stock levels, low-stock alerts, and purchase history — this module is still being built."
        icon={Boxes}
      />
    </div>
  );
}
