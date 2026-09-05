"use client";

import { PanelLeft } from "lucide-react";

export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function SidebarBackdrop({ open, onClick }: { open: boolean; onClick: () => void }) {
  if (!open) return null;
  return (
    <div
      onClick={onClick}
      aria-hidden="true"
      className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
    />
  );
}
