import { PageHeader } from "@/components/ui/page-header";
import { MonthlyAttendance } from "../monthly-attendance";

export default function PortalAttendancePage() {
  return (
    <div>
      <PageHeader title="Attendance" description="Your clock-in, clock-out, and break history." />
      <MonthlyAttendance />
    </div>
  );
}
