import type { FastifyPluginAsync } from "fastify";
import { PH_BANKS } from "./data";

const referenceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reference/banks", async (_request, reply) => {
    return reply.send({ banks: PH_BANKS });
  });
};

export default referenceRoutes;
