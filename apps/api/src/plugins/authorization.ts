import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "@business-platform/db";

declare module "fastify" {
  interface FastifyRequest {
    userRole: UserRole;
  }
  interface FastifyInstance {
    requireRole: (...roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// checks the caller's role against an allowed list for the route, and
// decorates request.userRole so handlers can apply finer-grained field-level
// rules (e.g. HR_ASSISTANT can edit an employee but not their salary/bank info)
const authorizationPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest("userRole", "" as UserRole);

  app.decorate("requireRole", (...roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await app.prisma.user.findUnique({ where: { id: request.userId }, select: { role: true } });
      if (!user) {
        return reply.code(403).send({ error: "You don't have permission to do this." });
      }

      request.userRole = user.role;

      if (!roles.includes(user.role)) {
        return reply.code(403).send({ error: "You don't have permission to do this." });
      }
    };
  });
});

export default authorizationPlugin;
