"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { PLAN_DETAILS, PLAN_CORE_MODULES } from "@business-platform/shared-types";
import type { CompanyPlan, ModuleKey } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

const MODULE_LABELS: Record<ModuleKey, string> = {
  employees: "Employees",
  payroll: "Payroll",
  loans: "Loans",
  "sinking-funds": "Sinking Funds",
  inventory: "Inventory",
  invoicing: "Invoicing",
};

export function BillingPanel({ plan, sinkingFundsActive }: { plan: CompanyPlan; sinkingFundsActive: boolean }) {
  const router = useRouter();
  const [isChangingPlan, setIsChangingPlan] = useState<CompanyPlan | null>(null);
  const [isTogglingAddon, setIsTogglingAddon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectPlan(nextPlan: CompanyPlan) {
    if (nextPlan === plan) return;
    setError(null);
    setIsChangingPlan(nextPlan);
    try {
      await apiClient.put("/api/billing/plan", { plan: nextPlan });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't switch plans.");
    } finally {
      setIsChangingPlan(null);
    }
  }

  async function handleToggleAddon() {
    setError(null);
    setIsTogglingAddon(true);
    try {
      await apiClient.put("/api/billing/addons/sinking-funds", { active: !sinkingFundsActive });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the Sinking Funds add-on.");
    } finally {
      setIsTogglingAddon(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLAN_DETAILS.map((details) => {
          const isCurrent = details.key === plan;
          return (
            <div
              key={details.key}
              className={`rounded-xl border p-5 ${
                isCurrent
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{details.label}</h3>
                {isCurrent && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Check className="h-3 w-3" />
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{details.priceLabel}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{details.description}</p>
              <ul className="mt-3 space-y-1">
                {PLAN_CORE_MODULES[details.key].map((module) => (
                  <li key={module} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    {MODULE_LABELS[module]}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSelectPlan(details.key)}
                disabled={isCurrent || isChangingPlan !== null}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isChangingPlan === details.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Current plan"
                ) : (
                  "Switch to this plan"
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sinking Funds add-on</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Recurring dues tracking with a dedicated member portal and QR payments — sold separately from your plan,
              priced per active fund member.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleAddon}
            disabled={isTogglingAddon}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              sinkingFundsActive
                ? "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isTogglingAddon ? <Loader2 className="h-4 w-4 animate-spin" /> : sinkingFundsActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}
