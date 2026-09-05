import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NAV_ITEMS } from "./nav-config";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const moduleItems = NAV_ITEMS.filter((item) => item.module && session.modules.includes(item.module));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Welcome back, {session.user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s what&apos;s available on {session.company.name}&apos;s plan.
        </p>
      </div>

      {moduleItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moduleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-600 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No modules are active on your plan yet.{" "}
            <Link href="/dashboard/settings/billing" className="font-medium text-primary hover:underline">
              Manage billing
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
