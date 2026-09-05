import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../modules/auth/session";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    companyId: string;
  }
}

// verifies the session cookie, decorates the request with userId + companyId
const authPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest("userId", "");
  app.decorateRequest("companyId", "");

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    try {
      const session = verifySessionToken(token);
      request.userId = session.sub;
      request.companyId = session.companyId;
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});

export default authPlugin;
