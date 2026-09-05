import type { FastifyPluginAsync } from "fastify";
import { createCompanySchema } from "./schema";
import { listUserCompanies, createCompanyForUser, canAccessCompany, HttpError } from "./service";
import { signSessionToken, setSessionCookie } from "../auth/session";
import { OWNER_ONLY } from "../../lib/roles";

const companiesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...OWNER_ONLY));

  app.get("/companies", async (request, reply) => {
    try {
      const companies = await listUserCompanies(app, request.userId);
      return reply.send({ companies, activeCompanyId: request.companyId });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/companies", async (request, reply) => {
    const input = createCompanySchema.parse(request.body);

    try {
      const company = await createCompanyForUser(app, request.userId, input.name);
      const token = signSessionToken({ sub: request.userId, companyId: company.id });
      setSessionCookie(reply, token, true);
      return reply.send({ company });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/companies/:id/switch", async (request, reply) => {
    const { id } = request.params as { id: string };

    const allowed = await canAccessCompany(app, request.userId, id);
    if (!allowed) {
      return reply.code(403).send({ error: "You don't have access to this company." });
    }

    const token = signSessionToken({ sub: request.userId, companyId: id });
    setSessionCookie(reply, token, true);
    return reply.send({ ok: true });
  });
};

export default companiesRoutes;
