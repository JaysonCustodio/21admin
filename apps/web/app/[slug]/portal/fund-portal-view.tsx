"use client";

import { useState, type CSSProperties } from "react";
import { LogOut, QrCode, X } from "lucide-react";
import type { FundMemberSession, SinkingFundFrequency } from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const FREQUENCY_LABELS: Record<SinkingFundFrequency, string> = {
  WEEKLY: "Weekly",
  SEMI_MONTHLY: "Twice a month",
  MONTHLY: "Monthly",
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function FundPortalView({ slug, session }: { slug: string; session: FundMemberSession }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const currency = session.company.defaultCurrency;

  const themeStyle = session.company.primaryColor
    ? ({ "--color-primary": session.company.primaryColor } as CSSProperties)
    : undefined;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await apiClient.post("/api/funds/logout", {});
    } finally {
      window.location.href = `/${slug}/login`;
    }
  }

  const totalDue = session.contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" style={themeStyle}>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          {session.company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API_BASE_URL}${session.company.logoUrl}`}
              alt={session.company.name}
              className="h-8 w-8 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.fund.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{session.company.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Welcome, {session.member.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {FREQUENCY_LABELS[session.fund.frequency]} · {formatCurrency(Number(session.fund.amountPerMember), currency)} per
          period
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total contributed
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(session.totalPaid, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">of {formatCurrency(totalDue, currency)} total</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Next contribution
            </p>
            {session.nextContribution ? (
              <>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(Number(session.nextContribution.amount), currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  due {formatDate(session.nextContribution.dueDate)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  <QrCode className="h-4 w-4" />
                  Pay now
                </button>
              </>
            ) : (
              <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">All paid up</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-2">Due date</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {session.contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{formatDate(c.dueDate)}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {formatCurrency(Number(c.amount), currency)}
                    </td>
                    <td className="px-4 py-2">
                      {c.paid ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : new Date(c.dueDate) < new Date() ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Scan to pay</h2>
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {session.fund.qrCodeUrl ? (
              <>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_BASE_URL}${session.fund.qrCodeUrl}`}
                    alt="Payment QR code"
                    className="w-full object-contain"
                  />
                </div>
                {session.nextContribution && (
                  <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
                    {formatCurrency(Number(session.nextContribution.amount), currency)} due{" "}
                    {formatDate(session.nextContribution.dueDate)}
                  </p>
                )}
                <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
                  After paying, let {session.company.name} know so they can mark your payment as received.
                </p>
              </>
            ) : (
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                A payment QR code hasn&apos;t been set up for this fund yet. Contact {session.company.name} for payment
                instructions.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
