import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { NAV_ITEMS } from "../../nav-config";

export default async function BillingSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const moduleItems = NAV_ITEMS.filter((item) => item.module);

  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and module access." />

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.company.name}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {session.modules.length} of {moduleItems.length} modules active
        </p>
        {session.company.slug && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Employee portal:{" "}
            <Link href={`/${session.company.slug}/login`} className="font-mono text-primary hover:underline">
              /{session.company.slug}/login
            </Link>
          </p>
        )}
      </div>

      <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
        {moduleItems.map((item) => {
          const isActive = item.module ? session.modules.includes(item.module) : false;
          const Icon = item.icon;
          return (
            <div key={item.href} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
              </div>
              {isActive ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-500">
                  <XCircle className="h-4 w-4" /> Not included
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
