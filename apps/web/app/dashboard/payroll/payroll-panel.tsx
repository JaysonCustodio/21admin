"use client";

import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import type { PayrollRunWithPayslips } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

function monthLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function currentMonthRange(): { periodStart: string; periodEnd: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { periodStart: start.toISOString(), periodEnd: end.toISOString(), label: monthLabel(start.toISOString()) };
}

function totalNetPay(run: PayrollRunWithPayslips): number {
  return run.payslips.reduce((sum, payslip) => sum + Number(payslip.netPay), 0);
}

export function PayrollPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const [runs, setRuns] = useState<PayrollRunWithPayslips[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadRuns() {
    apiClient
      .get<{ runs: PayrollRunWithPayslips[] }>("/api/payroll/runs")
      .then((data) => setRuns(data.runs))
      .catch(() => setRuns([]));
  }

  useEffect(loadRuns, []);

  const thisMonth = currentMonthRange();
  const alreadyRanThisMonth = runs?.some((run) => run.periodStart === thisMonth.periodStart) ?? false;

  async function handleRunPayroll() {
    setError(null);
    setIsRunning(true);
    try {
      await apiClient.post("/api/payroll/run", {
        periodStart: thisMonth.periodStart,
        periodEnd: thisMonth.periodEnd,
      });
      loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong running payroll.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Run payroll</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Generates a payslip for every active employee with a base salary set, for {thisMonth.label}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunPayroll}
            disabled={isRunning || alreadyRanThisMonth}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {alreadyRanThisMonth ? "Already ran this month" : "Run payroll"}
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Employees paid</th>
                <th className="px-4 py-2">Total net pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {runs === null && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {runs !== null && runs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No payroll runs yet.
                  </td>
                </tr>
              )}
              {runs?.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {monthLabel(run.periodStart)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{run.payslips.length}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                    {totalNetPay(run).toLocaleString(undefined, { style: "currency", currency: defaultCurrency })}
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
