import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function PayrollPage() {
  return (
    <div>
      <PageHeader title="Payroll" description="Run payroll and manage payslips for your team." />
      <ComingSoon
        title="Payroll automation is on its way"
        description="We're putting the finishing touches on running payroll and generating payslips for your team."
      />
    </div>
  );
}
