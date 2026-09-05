import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getFundSession } from "@/lib/fund-auth";
import { ChangePasswordForm } from "./change-password-form";
import { FundChangePasswordForm } from "./fund-change-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function ChangePasswordPage({ params }: { params: { slug: string } }) {
  const fundSession = await getFundSession();
  if (fundSession && fundSession.fund.slug === params.slug) {
    if (!fundSession.member.mustChangePassword) {
      redirect(`/${params.slug}/portal`);
    }
    return <FundChangePasswordForm slug={params.slug} />;
  }

  const session = await getSession();

  if (!session || session.company.slug !== params.slug) {
    redirect(`/${params.slug}/login`);
  }

  if (!session.mustChangePassword) {
    redirect(session.role === "MEMBER" ? `/${params.slug}/portal` : "/dashboard");
  }

  return <ChangePasswordForm slug={params.slug} />;
}
