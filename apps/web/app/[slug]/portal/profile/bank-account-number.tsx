"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function BankAccountNumber({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = value.length > 4 ? `••••${value.slice(-4)}` : value;

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-slate-900 dark:text-slate-100">{revealed ? value : masked}</span>
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        aria-label={revealed ? "Hide account number" : "Show account number"}
        className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
