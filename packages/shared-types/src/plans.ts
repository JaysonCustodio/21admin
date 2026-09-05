import type { ModuleKey } from "./entitlements";

export const PLAN_KEYS = ["STARTER", "GROWTH", "BUSINESS"] as const;

export type CompanyPlan = (typeof PLAN_KEYS)[number];

// sinking-funds is deliberately excluded — it's sold as a standalone add-on,
// not bundled into a tier, since it's just as often used by a treasurer with
// no employees at all as it is by a company already on one of these plans
export const PLAN_CORE_MODULES: Record<CompanyPlan, ModuleKey[]> = {
  STARTER: ["employees"],
  GROWTH: ["employees", "payroll", "loans"],
  BUSINESS: ["employees", "payroll", "loans", "inventory", "invoicing"],
};

export const SINKING_FUNDS_ADDON_MODULE: ModuleKey = "sinking-funds";

export interface PlanDetails {
  key: CompanyPlan;
  label: string;
  description: string;
  priceLabel: string;
}

export const PLAN_DETAILS: PlanDetails[] = [
  {
    key: "STARTER",
    label: "Starter",
    description: "Digitize your employee directory and attendance.",
    priceLabel: "Free",
  },
  {
    key: "GROWTH",
    label: "Growth",
    description: "Run payroll and manage employee loans.",
    priceLabel: "$29/mo",
  },
  {
    key: "BUSINESS",
    label: "Business",
    description: "The full back-office suite, including inventory and invoicing.",
    priceLabel: "$59/mo",
  },
];
