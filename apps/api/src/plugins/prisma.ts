import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@business-platform/db";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (app) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  app.decorate("prisma", prisma);
  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});

export default prismaPlugin;
