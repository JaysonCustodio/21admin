"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { EmployeeLookup, LoanWithDetails } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PAID_OFF: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  DEFAULTED: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function balanceOf(loan: LoanWithDetails): number {
  const paid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  return Math.max(0, Number(loan.principal) - paid);
}

export function LoansPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const [loans, setLoans] = useState<LoanWithDetails[] | null>(null);
  const [employees, setEmployees] = useState<EmployeeLookup[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function loadLoans() {
    apiClient
      .get<{ loans: LoanWithDetails[] }>("/api/loans")
      .then((data) => setLoans(data.loans))
      .catch(() => setLoans([]));
  }

  useEffect(loadLoans, []);
  useEffect(() => {
    apiClient
      .get<{ employees: EmployeeLookup[] }>("/api/employees/lookup")
      .then((data) => setEmployees(data.employees.filter((e) => e.status === "ACTIVE")))
      .catch(() => setEmployees([]));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!employeeId || !principal || !termMonths) {
      setError("Fill in all fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/loans", {
        employeeId,
        principal: Number(principal),
        termMonths: Number(termMonths),
      });
      setEmployeeId("");
      setPrincipal("");
      setTermMonths("12");
      setIsCreating(false);
      loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating this loan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRepayment(loanId: string) {
    const amount = repaymentAmounts[loanId];
    if (!amount) return;
    try {
      await apiClient.post(`/api/loans/${loanId}/repayments`, { amount: Number(amount) });
      setRepaymentAmounts((prev) => ({ ...prev, [loanId]: "" }));
      loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong recording that repayment.");
    }
  }

  return (
    <div className="space-y-4">
      {isCreating ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New loan</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="loan-employee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Employee
              </label>
              <select
                id="loan-employee"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Select…</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} ({employee.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="loan-principal" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount
              </label>
              <input
                id="loan-principal"
                type="number"
                min={0}
                required
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="10000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="loan-term" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Term (months)
              </label>
              <input
                id="loan-term"
                type="number"
                min={1}
                required
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create loan"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New loan
        </button>
      )}

      {!isCreating && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Employee</th>
                <th className="px-4 py-2">Principal</th>
                <th className="px-4 py-2">Term</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Record repayment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loans === null && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {loans !== null && loans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No loans yet.
                  </td>
                </tr>
              )}
              {loans?.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {loan.employee.fullName}
                    <span className="ml-1 font-mono text-xs text-slate-400">{loan.employee.employeeCode}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(Number(loan.principal), defaultCurrency)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{loan.termMonths} mo</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(balanceOf(loan), defaultCurrency)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[loan.status]}`}>
                      {loan.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {loan.status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={repaymentAmounts[loan.id] ?? ""}
                          onChange={(e) => setRepaymentAmounts((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                          placeholder="Amount"
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleRepayment(loan.id)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Record
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
