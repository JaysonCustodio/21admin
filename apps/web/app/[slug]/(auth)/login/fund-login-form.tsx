"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { apiClient } from "@/lib/api-client";

interface FormState {
  memberCode: string;
  password: string;
}

export function FundLoginForm({ slug, fundName }: { slug: string; fundName: string }) {
  const [form, setForm] = useState<FormState>({ memberCode: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post(`/api/funds/${slug}/login`, form);
      window.location.href = `/${slug}/portal`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect member code or password.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{fundName}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in with the member code and password you were given.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="memberCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Member code
          </label>
          <input
            id="memberCode"
            type="text"
            required
            autoComplete="username"
            value={form.memberCode}
            onChange={update("memberCode")}
            placeholder="MEM-0001"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 placeholder:normal-case focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
