// client helper: hasModule(company, "payroll")

import type { ModuleKey } from "@business-platform/shared-types";

export type { ModuleKey };

export interface CompanyEntitlements {
  companyId: string;
  modules: ModuleKey[];
}

export function hasModule(company: CompanyEntitlements, module: ModuleKey): boolean {
  return company.modules.includes(module);
}
