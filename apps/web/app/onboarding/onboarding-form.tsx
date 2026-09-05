"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { User, Briefcase } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type UsageType = "personal" | "business";

export function OnboardingForm() {
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function selectPersonal() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/onboarding", { usageType: "personal" });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  async function handleBusinessSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Enter your company or business name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/onboarding", { usageType: "business", companyName });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  if (usageType === "business") {
    return (
      <>
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What&apos;s your business called?</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This is the name your team will see.</p>
        </div>

        <form onSubmit={handleBusinessSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company or business name
            </label>
            <input
              id="companyName"
              type="text"
              required
              autoFocus
              value={companyName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUsageType(null)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How will you use 21 Admin?</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This helps us set up your workspace.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={selectPersonal}
          disabled={isSubmitting}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-left transition hover:border-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Personal use</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Just for me</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setUsageType("business")}
          disabled={isSubmitting}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-left transition hover:border-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <Briefcase className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Business</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">For my company or team</p>
          </div>
        </button>
      </div>
    </>
  );
}
