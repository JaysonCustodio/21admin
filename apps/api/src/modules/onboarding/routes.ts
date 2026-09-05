import type { FastifyPluginAsync } from "fastify";
import { onboardingSchema } from "./schema";
import { generateUniqueSlug } from "../../lib/slug";
import { OWNER_ONLY } from "../../lib/roles";

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...OWNER_ONLY));

  app.post("/onboarding", async (request, reply) => {
    const input = onboardingSchema.parse(request.body);

    const slug = input.usageType === "business" ? await generateUniqueSlug(app.prisma, input.companyName) : undefined;

    await app.prisma.company.update({
      where: { id: request.companyId },
      data: {
        accountType: input.usageType === "business" ? "BUSINESS" : "PERSONAL",
        ...(input.usageType === "business" ? { name: input.companyName, slug } : {}),
        onboardingCompletedAt: new Date(),
      },
    });

    return reply.send({ ok: true });
  });
};

export default onboardingRoutes;
