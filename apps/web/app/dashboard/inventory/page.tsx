import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { INVENTORY_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { AccessRestricted } from "../access-restricted";
import { InventoryPanel } from "./inventory-panel";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "inventory")) {
    return <ModuleLocked module="Inventory" />;
  }

  return (
    <div>
      <PageHeader title="Inventory" description="Keep stock levels up to date." />
      {hasRole(session.role, INVENTORY_MANAGERS) ? <InventoryPanel /> : <AccessRestricted />}
    </div>
  );
}
