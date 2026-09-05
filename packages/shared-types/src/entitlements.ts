export const MODULE_KEYS = [
  "employees",
  "payroll",
  "loans",
  "sinking-funds",
  "inventory",
  "invoicing",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface CompanyEntitlements {
  companyId: string;
  modules: ModuleKey[];
}
