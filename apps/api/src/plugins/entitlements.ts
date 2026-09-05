import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { ModuleKey } from "@business-platform/shared-types";

declare module "fastify" {
  interface FastifyInstance {
    requireModule: (module: ModuleKey) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// "is tenant subscribed to module X?"
const entitlementsPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorate("requireModule", (module: ModuleKey) => {
    return async (request, reply) => {
      const isEntitled = await app.prisma.entitlement.findFirst({
        where: { companyId: request.companyId, module, active: true },
      });

      if (!isEntitled) {
        return reply.code(403).send({ error: `Company is not subscribed to ${module}` });
      }
    };
  });
});

export default entitlementsPlugin;
