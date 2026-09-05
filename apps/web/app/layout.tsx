import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "21 Admin — Payroll, Loans & Community Funds",
    template: "%s · 21 Admin",
  },
  description:
    "Run payroll, employee loans, and recurring community funds in one dashboard — with a dedicated member portal for treasurers, co-ops, and HOAs.",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicons/favicon.ico"],
  },
  manifest: "/favicons/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "21 Admin",
    title: "21 Admin — Payroll, Loans & Community Funds",
    description:
      "Payroll, employee loans, and recurring community fund (sinking fund) management in one dashboard, with a dedicated member portal for treasurers and co-ops.",
    url: SITE_URL,
    images: ["/21admin-logo.png"],
  },
  twitter: {
    card: "summary",
    title: "21 Admin — Payroll, Loans & Community Funds",
    description:
      "Payroll, employee loans, and recurring community fund (sinking fund) management in one dashboard.",
    images: ["/21admin-logo.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
