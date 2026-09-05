import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { BankAccountNumber } from "./bank-account-number";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatSalary(amount: string | null, currency: string | null, defaultCurrency: string): string {
  if (!amount) return "—";
  const value = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency ?? defaultCurrency }).format(value);
  } catch {
    return `${currency ?? defaultCurrency} ${value.toLocaleString()}`;
  }
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PortalProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your employee information on file." />

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            {session.employee?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${API_BASE_URL}${session.employee.profileImageUrl}`}
                alt={session.user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400 dark:text-slate-500">
                {getInitials(session.user.fullName)}
              </div>
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{session.user.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{session.company.name}</p>
          </div>
        </div>

        <dl className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Employee ID</dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">{session.employee?.employeeCode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="text-slate-900 dark:text-slate-100">{session.user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Position</dt>
            <dd className="text-slate-900 dark:text-slate-100">{session.employee?.position ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Department</dt>
            <dd className="text-slate-900 dark:text-slate-100">{session.employee?.department ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Hire date</dt>
            <dd className="text-slate-900 dark:text-slate-100">{formatDate(session.employee?.hireDate ?? null)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payroll details</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This is what your employer has on file for paying you. Contact them to update it.
        </p>

        <dl className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Base salary</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {formatSalary(
                session.employee?.baseSalary ?? null,
                session.employee?.baseSalaryCurrency ?? null,
                session.company.defaultCurrency
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Bank name</dt>
            <dd className="text-slate-900 dark:text-slate-100">{session.employee?.bankName ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Account holder</dt>
            <dd className="text-slate-900 dark:text-slate-100">{session.employee?.bankAccountHolderName ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Account number</dt>
            <dd>
              {session.employee?.bankAccountNumber ? (
                <BankAccountNumber value={session.employee.bankAccountNumber} />
              ) : (
                <span className="text-slate-900 dark:text-slate-100">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
