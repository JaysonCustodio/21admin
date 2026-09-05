import type { FastifyInstance } from "fastify";
import { MODULE_KEYS, PLAN_CORE_MODULES, SINKING_FUNDS_ADDON_MODULE } from "@business-platform/shared-types";
import type { CompanyPlan } from "@business-platform/shared-types";

const CORE_MODULES = MODULE_KEYS.filter((module) => module !== SINKING_FUNDS_ADDON_MODULE);

export interface BillingState {
  plan: CompanyPlan;
  modules: string[];
}

async function getBillingState(app: FastifyInstance, companyId: string): Promise<BillingState> {
  const company = await app.prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { entitlements: true },
  });
  return {
    plan: company.plan,
    modules: company.entitlements.filter((e) => e.active).map((e) => e.module),
  };
}

export async function setCompanyPlan(app: FastifyInstance, companyId: string, plan: CompanyPlan): Promise<BillingState> {
  const includedModules = new Set(PLAN_CORE_MODULES[plan]);

  await app.prisma.$transaction([
    app.prisma.company.update({ where: { id: companyId }, data: { plan } }),
    ...CORE_MODULES.map((module) =>
      app.prisma.entitlement.upsert({
        where: { companyId_module: { companyId, module } },
        create: { companyId, module, active: includedModules.has(module) },
        update: { active: includedModules.has(module) },
      })
    ),
  ]);

  return getBillingState(app, companyId);
}

export async function setSinkingFundsAddon(app: FastifyInstance, companyId: string, active: boolean): Promise<BillingState> {
  await app.prisma.entitlement.upsert({
    where: { companyId_module: { companyId, module: SINKING_FUNDS_ADDON_MODULE } },
    create: { companyId, module: SINKING_FUNDS_ADDON_MODULE, active },
    update: { active },
  });

  return getBillingState(app, companyId);
}
