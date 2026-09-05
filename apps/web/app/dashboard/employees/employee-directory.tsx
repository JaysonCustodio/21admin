"use client";

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { Plus, KeyRound, Copy, Check, Search } from "lucide-react";
import type { Employee, EmployeeStatus } from "@business-platform/shared-types";
import { EMPLOYEE_STATUSES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";
import { StatusBadge, STATUS_LABELS } from "./status-badge";
import { EmployeeDetailModal } from "./employee-detail-modal";
import { EmployeeFormFields, type EmployeeFormValues } from "./employee-form-fields";
import { CopyButton } from "@/components/ui/copy-button";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface FormState extends EmployeeFormValues {
  employeeCode: string;
  autoGenerateCode: boolean;
}

function buildInitialForm(defaultCurrency: string): FormState {
  return {
    employeeCode: "",
    autoGenerateCode: true,
    fullName: "",
    email: "",
    companyEmail: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    position: "",
    department: "",
    employmentType: "",
    shiftSchedule: "",
    hireDate: "",
    baseSalary: "",
    baseSalaryCurrency: defaultCurrency as FormState["baseSalaryCurrency"],
    emergencyContactName: "",
    emergencyContactPhone: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolderName: "",
  };
}

interface PortalCredentials {
  email: string;
  temporaryPassword: string;
  portalUrl: string | null;
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

export function EmployeeDirectory({ defaultCurrency }: { defaultCurrency: string }) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(defaultCurrency));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalCredentials, setPortalCredentials] = useState<PortalCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filteredEmployees = useMemo(() => {
    if (!employees) return null;
    const query = searchQuery.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesStatus = statusFilter === "ALL" || employee.status === statusFilter;
      const matchesQuery =
        !query ||
        employee.fullName.toLowerCase().includes(query) ||
        employee.employeeCode.toLowerCase().includes(query) ||
        (employee.companyEmail?.toLowerCase().includes(query) ?? false) ||
        (employee.position?.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [employees, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const pageCount = filteredEmployees ? Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE)) : 1;
  const paginatedEmployees = filteredEmployees?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handlePhotoSelected(file: File) {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function resetPhotoSelection() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  useEffect(() => {
    apiClient
      .get<{ employees: Employee[] }>("/api/employees")
      .then((data) => setEmployees(data.employees))
      .catch(() => setEmployees([]));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) {
      setError("Enter the employee's name.");
      return;
    }

    setIsSubmitting(true);
    try {
      let { employee, portalCredentials: credentials } = await apiClient.post<{
        employee: Employee;
        portalCredentials: PortalCredentials | null;
      }>("/api/employees", {
        employeeCode: form.autoGenerateCode ? undefined : form.employeeCode || undefined,
        fullName: form.fullName,
        email: form.email || undefined,
        companyEmail: form.companyEmail || undefined,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        address: form.address || undefined,
        position: form.position || undefined,
        department: form.department || undefined,
        employmentType: form.employmentType || undefined,
        shiftSchedule: form.shiftSchedule || undefined,
        hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : undefined,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        baseSalaryCurrency: form.baseSalary ? form.baseSalaryCurrency : undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankAccountHolderName: form.bankAccountHolderName || undefined,
      });

      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append("file", photoFile);
          const { employee: withPhoto } = await apiClient.upload<{ employee: Employee }>(
            `/api/employees/${employee.id}/photo`,
            photoFormData
          );
          employee = withPhoto;
        } catch {
          // employee was created fine; the photo can be added later from the detail view
        }
      }

      setEmployees((prev) => [employee, ...(prev ?? [])]);
      setForm(buildInitialForm(defaultCurrency));
      resetPhotoSelection();
      setIsFormOpen(false);
      setPortalCredentials(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong adding this employee.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyCredentials() {
    if (!portalCredentials) return;
    const text = [
      portalCredentials.portalUrl ? `Portal: ${portalCredentials.portalUrl}` : null,
      `Email: ${portalCredentials.email}`,
      `Temporary password: ${portalCredentials.temporaryPassword}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEmployeeUpdated(updated: Employee) {
    setEmployees((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev));
    setSelectedEmployee(updated);
  }

  async function quickToggleActive(employee: Employee, e: MouseEvent) {
    e.stopPropagation();
    const nextStatus: EmployeeStatus = employee.status === "TERMINATED" ? "ACTIVE" : "TERMINATED";
    try {
      const { employee: updated } = await apiClient.patch<{ employee: Employee }>(`/api/employees/${employee.id}`, {
        status: nextStatus,
      });
      setEmployees((prev) => (prev ? prev.map((e2) => (e2.id === updated.id ? updated : e2)) : prev));
    } catch {
      // surfaced via the detail modal if the user retries there
    }
  }

  return (
    <div className="space-y-4">
      {portalCredentials && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Employee portal access created
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                Their temporary password is their Employee ID. They&apos;ll be required to set a new password the
                first time they sign in. Share these details with them now.
              </p>
              <div className="mt-3 space-y-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {portalCredentials.portalUrl && (
                  <p>
                    <span className="font-medium">Portal:</span> {portalCredentials.portalUrl}
                  </p>
                )}
                <p>
                  <span className="font-medium">Email:</span> {portalCredentials.email}
                </p>
                <p>
                  <span className="font-medium">Temporary password (Employee ID):</span>{" "}
                  <span className="font-mono">{portalCredentials.temporaryPassword}</span>
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy details"}
                </button>
                <button
                  type="button"
                  onClick={() => setPortalCredentials(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, email, or position…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | "ALL")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="ALL">All statuses</option>
          {EMPLOYEE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (isFormOpen) resetPhotoSelection();
            setIsFormOpen((open) => !open);
          }}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add employee
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          noValidate
        >
          <AvatarUpload
            imageUrl={photoPreviewUrl}
            fallbackText={form.fullName ? getInitials(form.fullName) : "?"}
            onFileSelected={handlePhotoSelected}
          />

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Employee ID</h3>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.autoGenerateCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, autoGenerateCode: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 dark:border-slate-600"
                />
                Auto-generate
              </label>
              {!form.autoGenerateCode && (
                <input
                  type="text"
                  value={form.employeeCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, employeeCode: e.target.value }))}
                  placeholder="EMP-0001"
                  className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              )}
            </div>
          </div>

          <EmployeeFormFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save employee"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Company email</th>
              <th className="px-5 py-3">Position</th>
              <th className="px-5 py-3">Base salary</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {employees === null && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {employees !== null && paginatedEmployees?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                  {employees.length === 0 ? "No employees yet. Add your first one above." : "No employees match your filters."}
                </td>
              </tr>
            )}
            {paginatedEmployees?.map((employee) => (
              <tr
                key={employee.id}
                onClick={() => setSelectedEmployee(employee)}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {employee.employeeCode}
                    <CopyButton value={employee.employeeCode} label="employee ID" />
                  </div>
                </td>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{employee.fullName}</td>
                <td className="px-5 py-3">
                  {employee.companyEmail ? (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      {employee.companyEmail}
                      <CopyButton value={employee.companyEmail} label="company email" />
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{employee.position ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                  {formatSalary(employee.baseSalary, employee.baseSalaryCurrency, defaultCurrency)}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={employee.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => quickToggleActive(employee, e)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {employee.status === "TERMINATED" ? "Reactivate" : "Deactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          defaultCurrency={defaultCurrency}
          onClose={() => setSelectedEmployee(null)}
          onUpdated={handleEmployeeUpdated}
        />
      )}
    </div>
  );
}
