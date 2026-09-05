import type { FastifyPluginAsync } from "fastify";
import type { User } from "@business-platform/db";
import { TEAM_MANAGERS } from "../../lib/roles";
import { inviteTeamMemberSchema, updateTeamMemberRoleSchema } from "./schema";
import { listTeamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember, HttpError } from "./service";

function toSafeMember(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

const teamRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...TEAM_MANAGERS));

  app.get("/team", async (request, reply) => {
    const members = await listTeamMembers(app, request.companyId);
    return reply.send({ members: members.map(toSafeMember) });
  });

  app.post("/team/invite", async (request, reply) => {
    const input = inviteTeamMemberSchema.parse(request.body);
    try {
      const { user, temporaryPassword } = await inviteTeamMember(app, request.companyId, input);
      return reply.send({ member: toSafeMember(user), temporaryPassword });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch("/team/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = updateTeamMemberRoleSchema.parse(request.body);
    try {
      const updated = await updateTeamMemberRole(app, request.companyId, id, input);
      return reply.send({ member: toSafeMember(updated) });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete("/team/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const updated = await removeTeamMember(app, request.companyId, id, request.userId);
      return reply.send({ member: toSafeMember(updated) });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default teamRoutes;
