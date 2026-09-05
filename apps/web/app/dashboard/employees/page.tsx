import { getSession } from "@/lib/auth";
import { hasModule } from "@/lib/entitlements";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleLocked } from "../module-locked";
import { EmployeesTabs } from "./employees-tabs";

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session || !hasModule({ companyId: session.company.id, modules: session.modules }, "employees")) {
    return <ModuleLocked module="Employees" />;
  }

  return (
    <div>
      <PageHeader title="Employees" description="Manage your employee directory." />
      <EmployeesTabs defaultCurrency={session.company.defaultCurrency} />
    </div>
  );
}
