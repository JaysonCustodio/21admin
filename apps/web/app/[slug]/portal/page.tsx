import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ClockWidget } from "./clock-widget";

export default async function PortalOverviewPage() {
  const session = await getSession();
  const firstName = session?.user.fullName.split(" ")[0] ?? "";

  return (
    <div>
      <PageHeader title={`Welcome, ${firstName}`} description="Clock in, clock out, and track your time." />
      <ClockWidget />
    </div>
  );
}
