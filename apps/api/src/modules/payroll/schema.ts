import { z } from "zod";

export const runPayrollSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;
