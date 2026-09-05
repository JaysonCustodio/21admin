import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

export function CenteredCardLayout({
  children,
  logoUrl,
  logoAlt = "21 Admin",
  style,
}: {
  children: ReactNode;
  logoUrl?: string | null;
  logoAlt?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900" style={style}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-[100px] w-[98px] rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <Image
              src="/21admin-logo.png"
              alt={logoAlt}
              width={98}
              height={100}
              priority
              className="rounded-2xl shadow-sm"
            />
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
