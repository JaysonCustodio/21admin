import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CenteredCardLayout } from "@/components/ui/centered-card-layout";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <CenteredCardLayout>{children}</CenteredCardLayout>;
}
