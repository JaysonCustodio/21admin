import type { FastifyPluginAsync } from "fastify";
import { portalLoginSchema } from "./schema";
import { verifyPassword } from "../auth/password";
import { signSessionToken, setSessionCookie } from "../auth/session";

const portalRoutes: FastifyPluginAsync = async (app) => {
  app.get("/portal/:slug/branding", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const company = await app.prisma.company.findUnique({ where: { slug } });
    if (!company) {
      return reply.code(404).send({ error: "Portal not found." });
    }

    return reply.send({
      name: company.name,
      logoUrl: company.logoUrl,
      primaryColor: company.primaryColor,
    });
  });

  app.post("/portal/:slug/login", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const input = portalLoginSchema.parse(request.body);

    const company = await app.prisma.company.findUnique({ where: { slug } });
    if (!company) {
      return reply.code(404).send({ error: "Portal not found." });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: input.email },
      include: { employeeRecord: true },
    });

    if (!user || user.companyId !== company.id || !user.employeeRecord || !user.passwordHash) {
      return reply.code(401).send({ error: "Incorrect email or password." });
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: "Incorrect email or password." });
    }

    if (user.employeeRecord.status === "SUSPENDED" || user.employeeRecord.status === "TERMINATED") {
      return reply.code(403).send({ error: "This account no longer has portal access." });
    }

    const token = signSessionToken({ sub: user.id, companyId: user.companyId });
    setSessionCookie(reply, token, true);

    return reply.send({ user: { id: user.id, email: user.email, fullName: user.fullName }, role: user.role });
  });
};

export default portalRoutes;
