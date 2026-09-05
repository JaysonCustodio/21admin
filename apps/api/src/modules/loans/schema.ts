import { z } from "zod";

export const createLoanSchema = z.object({
  employeeId: z.string(),
  principal: z.number().positive(),
  termMonths: z.number().int().positive(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const recordRepaymentSchema = z.object({
  amount: z.number().positive(),
});

export type RecordRepaymentInput = z.infer<typeof recordRepaymentSchema>;
