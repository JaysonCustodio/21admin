import type { ReactNode } from "react";
import { CenteredCardLayout } from "@/components/ui/centered-card-layout";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <CenteredCardLayout>{children}</CenteredCardLayout>;
}
