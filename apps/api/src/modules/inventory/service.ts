import type { FastifyInstance } from "fastify";
import type { InventoryItem } from "@business-platform/db";
import type { CreateInventoryItemInput } from "./schema";

export function listInventoryItems(app: FastifyInstance, companyId: string): Promise<InventoryItem[]> {
  return app.prisma.inventoryItem.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export function createInventoryItem(
  app: FastifyInstance,
  companyId: string,
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  return app.prisma.inventoryItem.create({
    data: { companyId, sku: input.sku, name: input.name, quantity: input.quantity },
  });
}
