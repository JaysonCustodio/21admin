"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
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

export function PortalTopbar({
  slug,
  fullName,
  profileImageUrl,
}: {
  slug: string;
  fullName: string;
  profileImageUrl: string | null;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await apiClient.post("/api/auth/logout", {});
    } finally {
      window.location.href = `/${slug}/login`;
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
      <ThemeToggle />
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{fullName}</p>
      {profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${API_BASE_URL}${profileImageUrl}`}
          alt={fullName}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {getInitials(fullName)}
        </div>
      )}
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
