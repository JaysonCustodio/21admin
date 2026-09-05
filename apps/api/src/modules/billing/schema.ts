import { z } from "zod";
import { PLAN_KEYS } from "@business-platform/shared-types";

export const setPlanSchema = z.object({
  plan: z.enum(PLAN_KEYS),
});

export type SetPlanInput = z.infer<typeof setPlanSchema>;

export const setSinkingFundsAddonSchema = z.object({
  active: z.boolean(),
});

export type SetSinkingFundsAddonInput = z.infer<typeof setSinkingFundsAddonSchema>;
