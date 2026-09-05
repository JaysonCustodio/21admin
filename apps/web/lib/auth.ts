// session helpers

import { cache } from "react";
import { cookies } from "next/headers";
import type { CompanyPlan, ModuleKey, UserRole } from "@business-platform/shared-types";
import { API_BASE_URL } from "./api-client";

export interface Session {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  role: UserRole;
  company: {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    defaultCurrency: string;
    accountType: "PERSONAL" | "BUSINESS" | null;
    plan: CompanyPlan;
  };
  modules: ModuleKey[];
  isEmployee: boolean;
  mustChangePassword: boolean;
  employee: {
    employeeCode: string;
    profileImageUrl: string | null;
    position: string | null;
    department: string | null;
    hireDate: string | null;
    baseSalary: string | null;
    baseSalaryCurrency: string | null;
    bankName: string | null;
    bankAccountHolderName: string | null;
    bankAccountNumber: string | null;
  } | null;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie) {
    return null;
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Cookie: `session=${sessionCookie.value}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<Session>;
});
