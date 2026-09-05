import { ShieldAlert } from "lucide-react";

export function AccessRestricted() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">You don&apos;t have access to this</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Your role doesn&apos;t include this section. Ask an Owner or Admin if you think this is a mistake.
      </p>
    </div>
  );
}
