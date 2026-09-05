import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { CompanySettingsForm } from "./company-settings-form";
import { PortalLinkCard } from "./portal-link-card";
import { CompaniesCard } from "./companies-card";

export default async function CompanySettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader title="Company" description="Manage your company profile, logo, and brand color." />
      {!session.isEmployee && <CompaniesCard currentCompanyId={session.company.id} />}
      {session.company.slug && <PortalLinkCard slug={session.company.slug} />}
      <CompanySettingsForm />
    </div>
  );
}
