"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  employees: "Employees",
  payroll: "Payroll",
  loans: "Loans",
  "sinking-funds": "Sinking Funds",
  inventory: "Inventory",
  invoicing: "Invoicing",
  settings: "Settings",
  company: "Company",
  team: "Team",
  billing: "Billing",
  attendance: "Attendance",
  payslips: "Payslips",
  profile: "Profile",
};

// "settings" has no page of its own (only its subroutes do), so it's never clickable
const NON_LINKABLE_SEGMENTS = new Set(["settings"]);

interface Crumb {
  label: string;
  href: string | null;
}

// `current` overrides the label of the final crumb — pages with a dynamic
// title (e.g. a sinking fund's actual name instead of its URL slug) pass the
// same title they gave PageHeader so the breadcrumb and heading always match
export function Breadcrumbs({ current }: { current?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  let rootLabel: string;
  let rootHref: string;
  let rest: string[];

  if (segments[0] === "dashboard") {
    rootLabel = "Dashboard";
    rootHref = "/dashboard";
    rest = segments.slice(1);
  } else if (segments[1] === "portal") {
    rootLabel = "Portal";
    rootHref = `/${segments[0]}/portal`;
    rest = segments.slice(2);
  } else {
    return null;
  }

  if (rest.length === 0) return null;

  const crumbs: Crumb[] = [];
  let hrefAccum = rootHref;
  rest.forEach((segment, index) => {
    hrefAccum += `/${segment}`;
    const isLast = index === rest.length - 1;
    const label = isLast && current ? current : (SEGMENT_LABELS[segment] ?? decodeURIComponent(segment));
    const isClickable = !isLast && !NON_LINKABLE_SEGMENTS.has(segment);
    crumbs.push({ label, href: isClickable ? hrefAccum : null });
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href={rootHref}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
      >
        <Home className="h-3.5 w-3.5" />
        {rootLabel}
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
          {crumb.href ? (
            <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
              {crumb.label}
            </Link>
          ) : index === crumbs.length - 1 ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">{crumb.label}</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
