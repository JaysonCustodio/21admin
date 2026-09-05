// session helpers for the sinking-fund member portal (separate from the
// company session in lib/auth.ts — a fund member is not a User account)

import { cache } from "react";
import { cookies } from "next/headers";
import type { FundMemberSession } from "@business-platform/shared-types";
import { API_BASE_URL } from "./api-client";

export const FUND_SESSION_COOKIE_NAME = "fund_session";

export const getFundSession = cache(async (): Promise<FundMemberSession | null> => {
  const sessionCookie = cookies().get(FUND_SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    return null;
  }

  const res = await fetch(`${API_BASE_URL}/api/funds/me`, {
    headers: { Cookie: `${FUND_SESSION_COOKIE_NAME}=${sessionCookie.value}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<FundMemberSession>;
});
