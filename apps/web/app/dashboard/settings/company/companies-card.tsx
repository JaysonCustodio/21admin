"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import type { Company } from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";

export function CompaniesCard({ currentCompanyId }: { currentCompanyId: string }) {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ companies: Company[] }>("/api/companies")
      .then((data) => setCompanies(data.companies))
      .catch(() => setCompanies([]));
  }, []);

  async function switchTo(companyId: string) {
    if (companyId === currentCompanyId) return;
    setIsSwitching(true);
    setError(null);
    try {
      await apiClient.post(`/api/companies/${companyId}/switch`, {});
      window.location.href = "/dashboard/settings/company";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't switch companies.");
      setIsSwitching(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Enter a company name.");
      return;
    }
    setIsSwitching(true);
    setError(null);
    try {
      await apiClient.post("/api/companies", { name: newName });
      window.location.href = "/dashboard/settings/company";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the company.");
      setIsSwitching(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your companies</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Switch between companies you own, or create a new one.
      </p>

      <div className="mt-3 space-y-1.5">
        {companies === null && <div className="px-1 py-2 text-sm text-slate-400 dark:text-slate-500">Loading…</div>}
        {companies?.map((company) => {
          const isCurrent = company.id === currentCompanyId;
          return (
            <div
              key={company.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${API_BASE_URL}${company.logoUrl}`} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {company.name}
              </span>
              {isCurrent ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" />
                  Current
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => switchTo(company.id)}
                  disabled={isSwitching}
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Switch
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && !isAdding && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {isAdding ? (
        <form onSubmit={handleCreate} className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New company name"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isSwitching}
            className="flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewName("");
              setError(null);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-primary transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Add new company
        </button>
      )}

      {error && isAdding && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
