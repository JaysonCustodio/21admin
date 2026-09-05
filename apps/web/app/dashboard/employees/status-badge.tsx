import type { EmployeeStatus } from "@business-platform/shared-types";

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  ON_LEAVE: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  SUSPENDED: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  TERMINATED: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Deactivated",
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
