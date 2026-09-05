import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function PortalPayslipsPage() {
  return (
    <div>
      <PageHeader title="Payslips" description="View your payslips by month." />
      <ComingSoon
        title="Payslips are on their way"
        description="Soon you'll be able to view your payslips here, month by month."
      />
    </div>
  );
}
