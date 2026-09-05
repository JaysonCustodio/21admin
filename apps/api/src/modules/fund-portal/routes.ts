import type { FastifyPluginAsync } from "fastify";
import { fundLoginSchema, fundChangePasswordSchema } from "./schema";
import { hashPassword, verifyPassword } from "../auth/password";
import {
  FUND_SESSION_COOKIE_NAME,
  signFundSessionToken,
  verifyFundSessionToken,
  setFundSessionCookie,
  clearFundSessionCookie,
} from "./session";

const fundPortalRoutes: FastifyPluginAsync = async (app) => {
  app.get("/funds/:slug/branding", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const fund = await app.prisma.sinkingFund.findUnique({ where: { slug }, include: { company: true } });
    if (!fund) {
      return reply.code(404).send({ error: "Fund portal not found." });
    }

    return reply.send({
      fundName: fund.name,
      name: fund.company.name,
      logoUrl: fund.company.logoUrl,
      primaryColor: fund.company.primaryColor,
    });
  });

  app.post("/funds/:slug/login", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const input = fundLoginSchema.parse(request.body);

    const fund = await app.prisma.sinkingFund.findUnique({ where: { slug } });
    if (!fund) {
      return reply.code(404).send({ error: "Fund portal not found." });
    }

    const member = await app.prisma.sinkingFundMember.findUnique({
      where: { sinkingFundId_memberCode: { sinkingFundId: fund.id, memberCode: input.memberCode.toUpperCase() } },
    });

    if (!member || !member.passwordHash) {
      return reply.code(401).send({ error: "Incorrect member code or password." });
    }

    const isValid = await verifyPassword(input.password, member.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: "Incorrect member code or password." });
    }

    const token = signFundSessionToken({ sub: member.id, fundId: fund.id });
    setFundSessionCookie(reply, token);

    return reply.send({ ok: true });
  });

  app.post("/funds/logout", async (_request, reply) => {
    clearFundSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get("/funds/me", async (request, reply) => {
    const token = request.cookies[FUND_SESSION_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    try {
      const session = verifyFundSessionToken(token);
      const member = await app.prisma.sinkingFundMember.findUnique({
        where: { id: session.sub },
        include: {
          employee: { select: { fullName: true } },
          sinkingFund: { include: { company: true } },
          contributions: { orderBy: { dueDate: "asc" } },
        },
      });

      if (!member || member.sinkingFundId !== session.fundId) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const paid = member.contributions.filter((c) => c.paid);
      const totalPaid = paid.reduce((sum, c) => sum + Number(c.amount), 0);
      const nextContribution = member.contributions.find((c) => !c.paid) ?? null;

      return reply.send({
        member: {
          id: member.id,
          fullName: member.employee?.fullName ?? member.manualName ?? "Member",
          memberCode: member.memberCode,
          mustChangePassword: member.mustChangePassword,
        },
        fund: {
          id: member.sinkingFund.id,
          name: member.sinkingFund.name,
          slug: member.sinkingFund.slug,
          frequency: member.sinkingFund.frequency,
          amountPerMember: member.sinkingFund.amountPerMember,
          startDate: member.sinkingFund.startDate,
          releaseDate: member.sinkingFund.releaseDate,
          qrCodeUrl: member.sinkingFund.qrCodeUrl,
        },
        company: {
          name: member.sinkingFund.company.name,
          logoUrl: member.sinkingFund.company.logoUrl,
          primaryColor: member.sinkingFund.company.primaryColor,
          defaultCurrency: member.sinkingFund.company.defaultCurrency,
        },
        totalPaid,
        nextContribution,
        contributions: member.contributions,
      });
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });

  app.post("/funds/change-password", async (request, reply) => {
    const token = request.cookies[FUND_SESSION_COOKIE_NAME];
    if (!token) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    const input = fundChangePasswordSchema.parse(request.body);

    try {
      const session = verifyFundSessionToken(token);
      const member = await app.prisma.sinkingFundMember.findUnique({ where: { id: session.sub } });
      if (!member?.passwordHash) {
        return reply.code(401).send({ error: "Not authenticated" });
      }

      const isValid = await verifyPassword(input.currentPassword, member.passwordHash);
      if (!isValid) {
        return reply.code(401).send({ error: "Current password is incorrect." });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await app.prisma.sinkingFundMember.update({
        where: { id: member.id },
        data: { passwordHash, mustChangePassword: false },
      });

      return reply.send({ ok: true });
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });
};

export default fundPortalRoutes;
