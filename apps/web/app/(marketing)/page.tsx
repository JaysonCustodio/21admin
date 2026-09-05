import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Wallet,
  HandCoins,
  PiggyBank,
  Boxes,
  Receipt,
  QrCode,
  KeyRound,
  History,
  Check,
  type LucideIcon,
} from "lucide-react";
import { PLAN_DETAILS, PLAN_CORE_MODULES } from "@business-platform/shared-types";
import type { ModuleKey } from "@business-platform/shared-types";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "21 Admin — Payroll, Loans & Community Funds",
  description:
    "Run payroll, employee loans, and recurring community funds in one dashboard — with a dedicated member portal for treasurers, co-ops, and HOAs.",
};

const MODULE_LABELS: Record<ModuleKey, string> = {
  employees: "Employees",
  payroll: "Payroll",
  loans: "Loans",
  "sinking-funds": "Sinking Funds",
  inventory: "Inventory",
  invoicing: "Invoicing",
};

interface Feature {
  icon: LucideIcon;
  label: string;
  description: string;
  comingSoon?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: Users,
    label: "Employees",
    description: "One directory for profiles, bank details, attendance, and shift schedules — plus a self-service employee portal.",
  },
  {
    icon: Wallet,
    label: "Payroll",
    description: "Run payroll by pay period with auto-calculated deductions. Payslips land straight in the employee portal.",
  },
  {
    icon: HandCoins,
    label: "Loans",
    description: "Issue loans funded by company cash or a sinking fund, with interest, term, and repayment tracking built in.",
  },
  {
    icon: PiggyBank,
    label: "Sinking Funds",
    description: "Recurring dues tracking per member, per period — with its own member login portal and QR code payments.",
  },
  {
    icon: Boxes,
    label: "Inventory",
    description: "Track stock levels by SKU with low-stock alerts.",
    comingSoon: true,
  },
  {
    icon: Receipt,
    label: "Invoicing",
    description: "Create and send customer invoices, and track paid, sent, and overdue status.",
    comingSoon: true,
  },
];

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
      {children}
    </a>
  );
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "21 Admin",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Payroll, HR, and Community Fund Management Software",
  description:
    "Payroll, employee loan tracking, and recurring community fund (sinking fund) dues management in one dashboard, with a dedicated member portal for treasurers, cooperatives, and HOAs.",
  operatingSystem: "Web",
  featureList: FEATURES.map((f) => `${f.label}: ${f.description}`),
  offers: PLAN_DETAILS.map((plan) => ({
    "@type": "Offer",
    name: plan.label,
    description: plan.description,
    price: plan.priceLabel === "Free" ? "0" : undefined,
    priceCurrency: plan.priceLabel === "Free" ? "USD" : undefined,
  })),
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Image src="/21admin-logo.png" alt="21 Admin" width={32} height={32} className="rounded-lg" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">21 Admin</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#sinking-funds">Sinking Funds</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Payroll, lending, and community funds — one dashboard
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Run your business — and your community fund — without the spreadsheets.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            21 Admin brings employees, payroll, and loans into one place for growing businesses — and gives cooperatives,
            HOAs, and community treasurers a dedicated portal to track dues, contributions, and payments.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Get started free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section id="features" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                Everything your back office needs
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                Turn on the modules you need. Every module respects who&apos;s allowed to see what, right out of the box.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      {feature.comingSoon && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{feature.label}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="sinking-funds" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 dark:border-primary/30 dark:bg-primary/10 sm:p-12 lg:grid-cols-2">
              <div>
                <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  For treasurers, co-ops &amp; HOAs
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Built for tracking dues, not just HR.
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  Sinking Funds works on its own — no employees or payroll required. Set up a fund, add members, and give
                  every one of them their own login to track what they owe and what they&apos;ve paid.
                </p>
                <Link
                  href="/register"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Start a fund
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { icon: History, text: "Per-member, per-period contribution tracking with a full payment history" },
                  { icon: KeyRound, text: "A dedicated member login — separate from your company account entirely" },
                  { icon: QrCode, text: "Upload your payment QR code once; members scan it to pay from their portal" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                Simple, module-based pricing
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                Pay for what you use. Upgrade or downgrade any time.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PLAN_DETAILS.map((details) => (
                <div
                  key={details.key}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{details.label}</h3>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{details.priceLabel}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{details.description}</p>
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {PLAN_CORE_MODULES[details.key].map((module) => (
                      <li key={module} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                        {MODULE_LABELS[module]}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Get started
                  </Link>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-4 max-w-none rounded-xl border border-primary/20 bg-primary/5 p-6 dark:border-primary/30 dark:bg-primary/10 sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sinking Funds add-on</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Sold separately from your plan, priced per active fund member — works even without Employees or Payroll.
                </p>
              </div>
              <Link
                href="/register"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 sm:mt-0"
              >
                Add to your plan
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Image src="/21admin-logo.png" alt="21 Admin" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">21 Admin</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} 21 Admin. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
