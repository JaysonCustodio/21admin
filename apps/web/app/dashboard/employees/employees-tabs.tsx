"use client";

import { useState } from "react";
import { EmployeeDirectory } from "./employee-directory";
import { AttendanceLog } from "./attendance-log";

type Tab = "directory" | "attendance";

const TABS: { key: Tab; label: string }[] = [
  { key: "directory", label: "Directory" },
  { key: "attendance", label: "Attendance" },
];

export function EmployeesTabs({ defaultCurrency }: { defaultCurrency: string }) {
  const [tab, setTab] = useState<Tab>("directory");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "directory" ? <EmployeeDirectory defaultCurrency={defaultCurrency} /> : <AttendanceLog />}
    </div>
  );
}
