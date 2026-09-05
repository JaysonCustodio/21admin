import { z } from "zod";

export const createInventoryItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
