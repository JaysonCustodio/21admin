"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Plus, X, ChevronRight, Trash2 } from "lucide-react";
import type { SinkingFundWithMembers, SinkingFundFrequency } from "@business-platform/shared-types";
import { SINKING_FUND_FREQUENCIES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

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

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function totalContributedFor(fund: SinkingFundWithMembers): number {
  return fund.members.reduce(
    (sum, m) => sum + m.contributions.filter((c) => c.paid).reduce((s, c) => s + Number(c.amount), 0),
    0
  );
}

export function SinkingFundsPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const [funds, setFunds] = useState<SinkingFundWithMembers[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<SinkingFundFrequency>("MONTHLY");
  const [amountPerMember, setAmountPerMember] = useState("");
  const [startDate, setStartDate] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fundToDelete, setFundToDelete] = useState<SinkingFundWithMembers | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function loadFunds() {
    apiClient
      .get<{ funds: SinkingFundWithMembers[] }>("/api/sinking-funds")
      .then((data) => setFunds(data.funds))
      .catch(() => setFunds([]));
  }

  useEffect(loadFunds, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amountPerMember || !startDate || !releaseDate) {
      setError("Fill in all fields.");
      return;
    }
    if (startDate < todayDateInputValue()) {
      setError("Start date can't be in the past.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/sinking-funds", {
        name,
        frequency,
        amountPerMember: Number(amountPerMember),
        startDate: new Date(startDate).toISOString(),
        releaseDate: new Date(releaseDate).toISOString(),
      });
      setName("");
      setFrequency("MONTHLY");
      setAmountPerMember("");
      setStartDate("");
      setReleaseDate("");
      setIsCreating(false);
      loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating this fund.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteFund(fundId: string) {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/sinking-funds/${fundId}`);
      setFundToDelete(null);
      loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that fund.");
    } finally {
      setIsDeleting(false);
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New sinking fund</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fund-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Fund name
              </label>
              <input
                id="fund-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Office renovation"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="fund-frequency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Payment frequency
              </label>
              <select
                id="fund-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SinkingFundFrequency)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {SINKING_FUND_FREQUENCIES.map((value) => (
                  <option key={value} value={value}>
                    {FREQUENCY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fund-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount per member
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">
                  {defaultCurrency}
                </span>
                <input
                  id="fund-amount"
                  type="number"
                  min={0}
                  required
                  value={amountPerMember}
                  onChange={(e) => setAmountPerMember(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-14 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="fund-start" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Start date
              </label>
              <input
                id="fund-start"
                type="date"
                required
                min={todayDateInputValue()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="fund-release" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Release date
              </label>
              <input
                id="fund-release"
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create fund"}
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
          New fund
        </button>
      )}

      {!isCreating && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        {funds === null && <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
        {funds !== null && funds.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No sinking funds yet.</p>
        )}
        {funds?.map((fund) => (
          <Link
            key={fund.id}
            href={`/dashboard/sinking-funds/${fund.slug}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary/40 dark:border-slate-700 dark:bg-slate-800"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fund.name}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {FREQUENCY_LABELS[fund.frequency]} · {formatCurrency(Number(fund.amountPerMember), defaultCurrency)} per
                member · {formatDate(fund.startDate)} – {formatDate(fund.releaseDate)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {fund.members.length} member{fund.members.length === 1 ? "" : "s"} ·{" "}
                {formatCurrency(totalContributedFor(fund), defaultCurrency)} contributed
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFundToDelete(fund);
                }}
                title="Delete fund"
                aria-label="Delete fund"
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>

      {fundToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Delete this fund?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This will permanently delete{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">{fundToDelete.name}</span>, including all its
              members and contribution records. This can&apos;t be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFundToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFund(fundToDelete.id)}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
