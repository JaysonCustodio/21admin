import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

// defense-in-depth: companyId is set by the auth plugin from the session token;
// this asserts it actually made it onto the request before a route handler runs
const tenantContextPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.companyId) {
      return reply.code(401).send({ error: "Missing company context" });
    }
  });
});

export default tenantContextPlugin;
