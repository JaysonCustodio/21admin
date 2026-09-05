import Link from "next/link";
import { Lock } from "lucide-react";

export function ModuleLocked({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
        <Lock className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {module} isn&apos;t included in your plan
      </h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Upgrade your plan to unlock {module.toLowerCase()} for your company.
      </p>
      <Link
        href="/dashboard/settings/billing"
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        Manage billing
      </Link>
    </div>
  );
}
