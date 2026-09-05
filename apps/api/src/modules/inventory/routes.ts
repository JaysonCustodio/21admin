import type { FastifyPluginAsync } from "fastify";
import { createInventoryItemSchema } from "./schema";
import { createInventoryItem, listInventoryItems } from "./service";
import { INVENTORY_MANAGERS } from "../../lib/roles";

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...INVENTORY_MANAGERS));

  app.get("/inventory", async (request, reply) => {
    const items = await listInventoryItems(app, request.companyId);
    return reply.send({ items });
  });

  app.post("/inventory", async (request, reply) => {
    const input = createInventoryItemSchema.parse(request.body);
    const item = await createInventoryItem(app, request.companyId, input);
    return reply.send({ item });
  });
};

export default inventoryRoutes;
