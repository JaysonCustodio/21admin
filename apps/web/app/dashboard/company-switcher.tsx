"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ChevronsUpDown, Plus, Check, Loader2 } from "lucide-react";
import type { Company } from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";

interface CurrentCompany {
  id: string;
  name: string;
  logoUrl: string | null;
}

export function CompanySwitcher({ current }: { current: CurrentCompany }) {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openMenu() {
    setIsOpen(true);
    setError(null);
    if (!companies) {
      apiClient
        .get<{ companies: Company[] }>("/api/companies")
        .then((data) => setCompanies(data.companies))
        .catch(() => setCompanies([]));
    }
  }

  function closeMenu() {
    setIsOpen(false);
    setIsAdding(false);
    setNewName("");
    setError(null);
  }

  async function switchTo(companyId: string) {
    if (companyId === current.id) {
      closeMenu();
      return;
    }
    setIsSwitching(true);
    setError(null);
    try {
      await apiClient.post(`/api/companies/${companyId}/switch`, {});
      window.location.href = "/dashboard";
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
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the company.");
      setIsSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className="flex w-full select-none items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {current.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_BASE_URL}${current.logoUrl}`}
            alt={current.name}
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <Image src="/21admin-logo.png" alt="21 Admin" width={32} height={32} className="shrink-0 rounded-lg" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{current.name}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeMenu} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {companies === null && <div className="px-3 py-2 text-sm text-slate-400">Loading…</div>}
            {companies?.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => switchTo(company.id)}
                disabled={isSwitching}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API_BASE_URL}${company.logoUrl}`} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{company.name}</span>
                {company.id === current.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}

            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

            {isAdding ? (
              <form onSubmit={handleCreate} className="p-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Company name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    type="submit"
                    disabled={isSwitching}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isSwitching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {error && <p className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-primary transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4" />
                  Add company
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
