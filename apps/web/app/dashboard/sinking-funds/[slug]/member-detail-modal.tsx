"use client";

import { X } from "lucide-react";
import type { SinkingFundWithMembers } from "@business-platform/shared-types";

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function memberName(member: SinkingFundWithMembers["members"][number]): string {
  return member.employee?.fullName ?? member.manualName ?? "Unknown";
}

export function MemberDetailModal({
  member,
  fundName,
  defaultCurrency,
  onClose,
}: {
  member: SinkingFundWithMembers["members"][number];
  fundName: string;
  defaultCurrency: string;
  onClose: () => void;
}) {
  const totalPaid = member.contributions.filter((c) => c.paid).reduce((sum, c) => sum + Number(c.amount), 0);
  const totalDue = member.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const nextUnpaid = member.contributions.find((c) => !c.paid) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{memberName(member)}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {member.memberCode} · {fundName}
            </p>
            {(member.manualMobile || member.manualEmail) && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {[member.manualMobile, member.manualEmail].filter(Boolean).join(" · ")}
              </p>
            )}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Total contributed
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalPaid, defaultCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                of {formatCurrency(totalDue, defaultCurrency)} total
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Next payment
              </p>
              {nextUnpaid ? (
                <>
                  <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(nextUnpaid.amount), defaultCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">due {formatDate(nextUnpaid.dueDate)}</p>
                </>
              ) : (
                <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">All paid up</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contribution history</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 border-b border-slate-200 bg-white text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      <th className="px-3 py-2">Due date</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {member.contributions.map((c) => {
                      const isOverdue = !c.paid && new Date(c.dueDate) < new Date();
                      return (
                        <tr key={c.id}>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{formatDate(c.dueDate)}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {formatCurrency(Number(c.amount), defaultCurrency)}
                          </td>
                          <td className="px-3 py-2">
                            {c.paid ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                Paid {c.paidAt && `· ${formatDate(c.paidAt)}`}
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                Upcoming
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
