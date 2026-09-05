import { Breadcrumbs } from "./breadcrumbs";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <Breadcrumbs current={title} />
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}
