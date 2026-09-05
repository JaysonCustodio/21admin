import type { FastifyPluginAsync } from "fastify";
import { registerSchema, loginSchema, changePasswordSchema } from "./schema";
import { registerWithPassword, loginWithPassword, AuthError } from "./service";
import { hashPassword, verifyPassword } from "./password";
import { signSessionToken, setSessionCookie, clearSessionCookie, verifySessionToken, SESSION_COOKIE_NAME } from "./session";

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    try {
      const user = await registerWithPassword(app, input);
      const token = signSessionToken({ sub: user.id, companyId: user.companyId });
      setSessionCookie(reply, token, true);
      return reply.send({ user: { id: user.id, email: user.email, fullName: user.fullName } });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);

    try {
      const user = await loginWithPassword(app, input);
      const token = signSessionToken({ sub: user.id, companyId: user.companyId });
      setSessionCookie(reply, token, input.rememberMe);
      return reply.send({ user: { id: user.id, email: user.email, fullName: user.fullName } });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get("/me", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    try {
      const session = verifySessionToken(token);
      const user = await app.prisma.user.findUnique({
        where: { id: session.sub },
        include: { employeeRecord: true },
      });
      if (!user) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      // the active company is whichever companyId is on the session token — not
      // necessarily the user's own home company, since owners can switch companies
      const company = await app.prisma.company.findUnique({
        where: { id: session.companyId },
        include: { entitlements: true },
      });
      if (!company) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const modules = company.entitlements.filter((e) => e.active).map((e) => e.module);

      return reply.send({
        user: { id: user.id, email: user.email, fullName: user.fullName },
        role: user.role,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          logoUrl: company.logoUrl,
          primaryColor: company.primaryColor,
          defaultCurrency: company.defaultCurrency,
          accountType: company.accountType,
          plan: company.plan,
        },
        modules,
        isEmployee: user.employeeRecord !== null,
        mustChangePassword: user.mustChangePassword,
        employee: user.employeeRecord
          ? {
              employeeCode: user.employeeRecord.employeeCode,
              profileImageUrl: user.employeeRecord.profileImageUrl,
              position: user.employeeRecord.position,
              department: user.employeeRecord.department,
              hireDate: user.employeeRecord.hireDate,
              baseSalary: user.employeeRecord.baseSalary,
              baseSalaryCurrency: user.employeeRecord.baseSalaryCurrency,
              bankName: user.employeeRecord.bankName,
              bankAccountHolderName: user.employeeRecord.bankAccountHolderName,
              bankAccountNumber: user.employeeRecord.bankAccountNumber,
            }
          : null,
      });
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });

  app.post("/change-password", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    const input = changePasswordSchema.parse(request.body);

    try {
      const session = verifySessionToken(token);
      const user = await app.prisma.user.findUnique({ where: { id: session.sub } });
      if (!user?.passwordHash) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValid) {
        return reply.code(401).send({ error: "Current password is incorrect." });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await app.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });

      return reply.send({ ok: true, role: user.role });
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });
};

export default authRoutes;
