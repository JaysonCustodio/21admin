import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CenteredCardLayout } from "@/components/ui/centered-card-layout";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) {
    if (session.mustChangePassword) {
      redirect(session.company.slug ? `/${session.company.slug}/change-password` : "/dashboard");
    }
    redirect(session.role === "MEMBER" && session.company.slug ? `/${session.company.slug}/portal` : "/dashboard");
  }

  return <CenteredCardLayout>{children}</CenteredCardLayout>;
}
