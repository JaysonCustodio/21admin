import { Rocket, type LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon = Rocket,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        Coming soon
      </span>
    </div>
  );
}
