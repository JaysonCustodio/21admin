"use client";

import { X } from "lucide-react";
import type { LoanWithDetails } from "@business-platform/shared-types";

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function totalPayableOf(loan: LoanWithDetails): number {
  return Number(loan.principal) * (1 + Number(loan.interestRate) / 100);
}

function borrowerName(loan: LoanWithDetails): string {
  if (loan.employee) return loan.employee.fullName;
  if (loan.sinkingFundMember) {
    return loan.sinkingFundMember.employee?.fullName ?? loan.sinkingFundMember.manualName ?? loan.sinkingFundMember.memberCode;
  }
  return loan.manualBorrowerName ?? "—";
}

function borrowerSubtitle(loan: LoanWithDetails): string | null {
  if (loan.employee) return loan.employee.employeeCode;
  if (loan.sinkingFundMember) return loan.sinkingFundMember.memberCode;
  return null;
}

function fundSourceLabel(loan: LoanWithDetails): string {
  return loan.fundSource === "PERSONAL" ? "Personal" : (loan.sinkingFund?.name ?? "Sinking fund");
}

export function LoanDetailModal({
  loan,
  defaultCurrency,
  onClose,
}: {
  loan: LoanWithDetails;
  defaultCurrency: string;
  onClose: () => void;
}) {
  const totalPayable = totalPayableOf(loan);
  const totalPaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  const balance = Math.max(0, totalPayable - totalPaid);
  const sortedRepayments = [...loan.repayments].sort(
    (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{borrowerName(loan)}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[borrowerSubtitle(loan), fundSourceLabel(loan)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Principal</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(Number(loan.principal), defaultCurrency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Interest</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{Number(loan.interestRate)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Term</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.termMonths} mo</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.status.replace("_", " ")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Total paid
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalPaid, defaultCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                of {formatCurrency(totalPayable, defaultCurrency)} total payable
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Remaining balance
              </p>
              {balance > 0 ? (
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(balance, defaultCurrency)}
                </p>
              ) : (
                <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">Paid off</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payment history</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              {sortedRepayments.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400 dark:text-slate-500">No payments recorded yet.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="sticky top-0 border-b border-slate-200 bg-white text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        <th className="px-3 py-2">Date paid</th>
                        <th className="px-3 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {sortedRepayments.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{formatDate(r.paidAt)}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {formatCurrency(Number(r.amount), defaultCurrency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
