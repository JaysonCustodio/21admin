"use client";

import { useState } from "react";
import { X, KeyRound } from "lucide-react";
import type { Employee, EmployeeStatus } from "@business-platform/shared-types";
import { EMPLOYEE_STATUSES } from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import { StatusBadge } from "./status-badge";
import { EmployeeFormFields, EMPLOYMENT_TYPE_LABELS, SHIFT_SCHEDULE_LABELS, type EmployeeFormValues } from "./employee-form-fields";
import { CopyButton } from "@/components/ui/copy-button";
import { AvatarUpload } from "@/components/ui/avatar-upload";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface PortalCredentials {
  email: string;
  temporaryPassword: string;
  portalUrl: string | null;
}

function toFormValues(employee: Employee, defaultCurrency: string): EmployeeFormValues {
  return {
    fullName: employee.fullName,
    email: employee.email ?? "",
    companyEmail: employee.companyEmail ?? "",
    phone: employee.phone ?? "",
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
    address: employee.address ?? "",
    position: employee.position ?? "",
    department: employee.department ?? "",
    employmentType: employee.employmentType ?? "",
    shiftSchedule: employee.shiftSchedule ?? "",
    hireDate: employee.hireDate ? employee.hireDate.slice(0, 10) : "",
    baseSalary: employee.baseSalary ?? "",
    baseSalaryCurrency: (employee.baseSalaryCurrency ?? defaultCurrency) as EmployeeFormValues["baseSalaryCurrency"],
    emergencyContactName: employee.emergencyContactName ?? "",
    emergencyContactPhone: employee.emergencyContactPhone ?? "",
    bankName: employee.bankName ?? "",
    bankAccountNumber: employee.bankAccountNumber ?? "",
    bankAccountHolderName: employee.bankAccountHolderName ?? "",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Deactivated",
};

function DetailRow({ label, value, copyLabel }: { label: string; value: string; copyLabel?: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-700">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right text-slate-900 dark:text-slate-100">
        {value}
        {copyLabel && value !== "—" && <CopyButton value={value} label={copyLabel} />}
      </dd>
    </div>
  );
}

export function EmployeeDetailModal({
  employee,
  defaultCurrency,
  onClose,
  onUpdated,
}: {
  employee: Employee;
  defaultCurrency: string;
  onClose: () => void;
  onUpdated: (employee: Employee) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [employeeCode, setEmployeeCode] = useState(employee.employeeCode);
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [values, setValues] = useState<EmployeeFormValues>(() => toFormValues(employee, defaultCurrency));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPortalCredentials, setNewPortalCredentials] = useState<PortalCredentials | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  function resetToViewMode() {
    setEmployeeCode(employee.employeeCode);
    setStatus(employee.status);
    setValues(toFormValues(employee, defaultCurrency));
    setError(null);
    setMode("view");
  }

  async function patchEmployee(body: Record<string, unknown>) {
    setError(null);
    setIsSubmitting(true);
    try {
      const { employee: updated, portalCredentials } = await apiClient.patch<{
        employee: Employee;
        portalCredentials: PortalCredentials | null;
      }>(`/api/employees/${employee.id}`, body);
      onUpdated(updated);
      if (portalCredentials) setNewPortalCredentials(portalCredentials);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong updating this employee.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave() {
    if (!values.fullName.trim()) {
      setError("Enter the employee's name.");
      return;
    }

    const updated = await patchEmployee({
      employeeCode,
      status,
      fullName: values.fullName,
      email: values.email || null,
      companyEmail: values.companyEmail || null,
      phone: values.phone || null,
      dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
      address: values.address || null,
      position: values.position || null,
      department: values.department || null,
      employmentType: values.employmentType || null,
      shiftSchedule: values.shiftSchedule || null,
      hireDate: values.hireDate ? new Date(values.hireDate).toISOString() : null,
      baseSalary: values.baseSalary ? Number(values.baseSalary) : null,
      baseSalaryCurrency: values.baseSalary ? values.baseSalaryCurrency : null,
      emergencyContactName: values.emergencyContactName || null,
      emergencyContactPhone: values.emergencyContactPhone || null,
      bankName: values.bankName || null,
      bankAccountNumber: values.bankAccountNumber || null,
      bankAccountHolderName: values.bankAccountHolderName || null,
    });

    if (updated) setMode("view");
  }

  async function handlePhotoSelected(file: File) {
    setError(null);
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { employee: updated } = await apiClient.upload<{ employee: Employee }>(
        `/api/employees/${employee.id}/photo`,
        formData
      );
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong uploading the photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function toggleActive() {
    const nextStatus: EmployeeStatus = employee.status === "TERMINATED" ? "ACTIVE" : "TERMINATED";
    const updated = await patchEmployee({ status: nextStatus });
    if (updated) setStatus(updated.status);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{employee.fullName}</h2>
            <StatusBadge status={employee.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <AvatarUpload
            imageUrl={employee.profileImageUrl ? `${API_BASE_URL}${employee.profileImageUrl}` : null}
            fallbackText={getInitials(employee.fullName)}
            onFileSelected={handlePhotoSelected}
            isUploading={isUploadingPhoto}
          />

          {mode === "view" ? (
            <>
              {newPortalCredentials && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        Employee portal access created
                      </p>
                      <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                        Their temporary password is their Employee ID. They&apos;ll be required to set a new
                        password the first time they sign in.
                      </p>
                      <div className="mt-2 space-y-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {newPortalCredentials.portalUrl && (
                          <p>
                            <span className="font-medium">Portal:</span> {newPortalCredentials.portalUrl}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Email:</span> {newPortalCredentials.email}
                        </p>
                        <p>
                          <span className="font-medium">Temporary password:</span>{" "}
                          <span className="font-mono">{newPortalCredentials.temporaryPassword}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewPortalCredentials(null)}
                        className="mt-2 text-sm font-medium text-amber-800 hover:underline dark:text-amber-400"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <dl>
                <DetailRow label="Employee ID" value={employee.employeeCode} copyLabel="employee ID" />
                <DetailRow label="Personal email" value={employee.email ?? "—"} />
                <DetailRow label="Company email" value={employee.companyEmail ?? "—"} copyLabel="company email" />
                <DetailRow label="Phone" value={employee.phone ?? "—"} />
                <DetailRow label="Date of birth" value={formatDate(employee.dateOfBirth)} />
                <DetailRow label="Address" value={employee.address ?? "—"} />
                <DetailRow label="Position" value={employee.position ?? "—"} />
                <DetailRow label="Department" value={employee.department ?? "—"} />
                <DetailRow
                  label="Employment type"
                  value={employee.employmentType ? EMPLOYMENT_TYPE_LABELS[employee.employmentType] : "—"}
                />
                <DetailRow
                  label="Shift schedule"
                  value={employee.shiftSchedule ? SHIFT_SCHEDULE_LABELS[employee.shiftSchedule] : "—"}
                />
                <DetailRow label="Hire date" value={formatDate(employee.hireDate)} />
                <DetailRow
                  label="Base salary"
                  value={employee.baseSalary ? `${employee.baseSalaryCurrency ?? defaultCurrency} ${Number(employee.baseSalary).toLocaleString()}` : "—"}
                />
                <DetailRow label="Emergency contact" value={employee.emergencyContactName ?? "—"} />
                <DetailRow label="Emergency phone" value={employee.emergencyContactPhone ?? "—"} />
                <DetailRow label="Bank name" value={employee.bankName ?? "—"} />
                <DetailRow label="Account holder" value={employee.bankAccountHolderName ?? "—"} />
                <DetailRow
                  label="Account number"
                  value={employee.bankAccountNumber ?? "—"}
                  copyLabel="account number"
                />
                <DetailRow label="Status" value={STATUS_LABELS[employee.status]} />
              </dl>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={toggleActive}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {employee.status === "TERMINATED" ? "Reactivate" : "Deactivate"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-employeeCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Employee ID
                  </label>
                  <input
                    id="edit-employeeCode"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {EMPLOYEE_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <EmployeeFormFields idPrefix="edit-" values={values} onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))} />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={resetToViewMode}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
