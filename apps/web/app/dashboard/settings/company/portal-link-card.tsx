"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

export function PortalLinkCard({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const portalUrl = `${origin}/${slug}/login`;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Employee portal link</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Share this link with your employees so they can sign in to their portal.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
        <Link href={`/${slug}/login`} className="flex-1 truncate font-mono text-sm text-primary hover:underline">
          {portalUrl}
        </Link>
        <CopyButton value={portalUrl} label="employee portal link" />
      </div>
    </div>
  );
}
