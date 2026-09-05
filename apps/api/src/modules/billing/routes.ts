import type { FastifyPluginAsync } from "fastify";
import { setPlanSchema, setSinkingFundsAddonSchema } from "./schema";
import { setCompanyPlan, setSinkingFundsAddon } from "./service";
import { OWNER_ONLY } from "../../lib/roles";

const billingRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...OWNER_ONLY));

  app.put("/billing/plan", async (request, reply) => {
    const input = setPlanSchema.parse(request.body);
    const state = await setCompanyPlan(app, request.companyId, input.plan);
    return reply.send(state);
  });

  app.put("/billing/addons/sinking-funds", async (request, reply) => {
    const input = setSinkingFundsAddonSchema.parse(request.body);
    const state = await setSinkingFundsAddon(app, request.companyId, input.active);
    return reply.send(state);
  });
};

export default billingRoutes;
