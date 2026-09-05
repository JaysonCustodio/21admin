"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({ fullName, email }: { fullName: string; email: string }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await apiClient.post("/api/auth/logout", {});
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
      <ThemeToggle />
      <div className="text-right">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{fullName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        {getInitials(fullName)}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </header>
  );
}
