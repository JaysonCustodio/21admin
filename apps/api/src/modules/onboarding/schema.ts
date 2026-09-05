import { z } from "zod";

export const onboardingSchema = z.discriminatedUnion("usageType", [
  z.object({ usageType: z.literal("personal") }),
  z.object({ usageType: z.literal("business"), companyName: z.string().min(1) }),
]);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
