"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import type { PayslipWithRun } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(value: string, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value));
}

export function PayslipsView({ defaultCurrency }: { defaultCurrency: string }) {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payslips, setPayslips] = useState<PayslipWithRun[] | null>(null);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPayslips(null);
    setError(null);
    apiClient
      .get<{ payslips: PayslipWithRun[]; currency: string }>(`/api/payroll/me?year=${year}&month=${month}`)
      .then((data) => {
        setPayslips(data.payslips);
        setCurrency(data.currency);
      })
      .catch(() => setError("Couldn't load your payslips."));
  }, [year, month]);

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payslips</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthLabel(year, month)}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      {payslips === null && !error && (
        <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      )}

      {payslips !== null && payslips.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-600 dark:bg-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No payslip for {monthLabel(year, month)}.</p>
        </div>
      )}

      {payslips?.map((payslip) => (
        <div key={payslip.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Payslip</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dateLabel(payslip.payrollRun.periodStart)} – {dateLabel(payslip.payrollRun.periodEnd)}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {payslip.payrollRun.status}
            </span>
          </div>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Gross pay</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatAmount(payslip.grossPay, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Deductions</dt>
              <dd className="text-slate-900 dark:text-slate-100">−{formatAmount(payslip.deductions, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold dark:border-slate-700">
              <dt className="text-slate-900 dark:text-slate-100">Net pay</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatAmount(payslip.netPay, currency)}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
