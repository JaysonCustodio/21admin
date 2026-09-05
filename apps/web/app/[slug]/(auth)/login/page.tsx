import type { Metadata } from "next";
import { getPortalBranding } from "@/lib/portal-branding";
import { PortalLoginForm } from "./portal-login-form";
import { FundLoginForm } from "./fund-login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function PortalLoginPage({ params }: { params: { slug: string } }) {
  const branding = await getPortalBranding(params.slug);

  if (branding?.fundName) {
    return <FundLoginForm slug={params.slug} fundName={branding.fundName} />;
  }

  if (!branding) {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">This link is no longer active</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This fund has been completed, canceled, or removed, so this portal link no longer works. Contact whoever
          shared it with you if you have questions.
        </p>
      </div>
    );
  }

  return <PortalLoginForm slug={params.slug} />;
}
