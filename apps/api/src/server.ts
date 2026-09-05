import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";
import { env } from "./env";
import { UPLOADS_ROOT } from "./lib/uploads";

import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";
import tenantContextPlugin from "./plugins/tenant-context";
import entitlementsPlugin from "./plugins/entitlements";
import authorizationPlugin from "./plugins/authorization";

import authRoutes from "./modules/auth/routes";
import googleAuthRoutes from "./modules/auth/google";
import onboardingRoutes from "./modules/onboarding/routes";
import portalRoutes from "./modules/portal/routes";
import fundPortalRoutes from "./modules/fund-portal/routes";
import referenceRoutes from "./modules/reference/routes";

import companyRoutes from "./modules/company/routes";
import companiesRoutes from "./modules/companies/routes";
import teamRoutes from "./modules/team/routes";
import employeesRoutes from "./modules/employees/routes";
import attendanceRoutes from "./modules/attendance/routes";
import payrollRoutes from "./modules/payroll/routes";
import loansRoutes from "./modules/loans/routes";
import sinkingFundsRoutes from "./modules/sinking-funds/routes";
import inventoryRoutes from "./modules/inventory/routes";
import invoicingRoutes from "./modules/invoicing/routes";
import billingRoutes from "./modules/billing/routes";

import stripeWebhooksRoutes from "./billing/stripe-webhooks";

async function buildServer() {
  const app = Fastify({ logger: true });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: error.errors[0]?.message ?? "Invalid request" });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Internal server error" });
  });

  await app.register(cors, { origin: env.WEB_APP_URL, credentials: true });
  await app.register(cookie);
  await app.register(prismaPlugin);
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(fastifyStatic, { root: UPLOADS_ROOT, prefix: "/uploads/" });

  // public routes: no session required
  await app.register(stripeWebhooksRoutes);
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(googleAuthRoutes, { prefix: "/api/auth" });
  await app.register(portalRoutes, { prefix: "/api" });
  await app.register(fundPortalRoutes, { prefix: "/api" });
  await app.register(referenceRoutes, { prefix: "/api" });

  // protected routes: require a valid session + tenant context
  await app.register(async (protectedApp) => {
    await protectedApp.register(authPlugin);
    await protectedApp.register(tenantContextPlugin);
    await protectedApp.register(entitlementsPlugin);
    await protectedApp.register(authorizationPlugin);

    await protectedApp.register(onboardingRoutes, { prefix: "/api" });
    await protectedApp.register(companyRoutes, { prefix: "/api" });
    await protectedApp.register(companiesRoutes, { prefix: "/api" });
    await protectedApp.register(teamRoutes, { prefix: "/api" });
    await protectedApp.register(employeesRoutes, { prefix: "/api" });
    await protectedApp.register(attendanceRoutes, { prefix: "/api" });
    await protectedApp.register(payrollRoutes, { prefix: "/api" });
    await protectedApp.register(loansRoutes, { prefix: "/api" });
    await protectedApp.register(sinkingFundsRoutes, { prefix: "/api" });
    await protectedApp.register(inventoryRoutes, { prefix: "/api" });
    await protectedApp.register(invoicingRoutes, { prefix: "/api" });
    await protectedApp.register(billingRoutes, { prefix: "/api" });
  });

  return app;
}

buildServer()
  .then((app) => app.listen({ port: env.PORT, host: "0.0.0.0" }))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
