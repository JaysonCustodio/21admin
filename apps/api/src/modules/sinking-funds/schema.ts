import { z } from "zod";
import { SINKING_FUND_FREQUENCIES } from "@business-platform/shared-types";

export const createSinkingFundSchema = z
  .object({
    name: z.string().min(1),
    frequency: z.enum(SINKING_FUND_FREQUENCIES),
    amountPerMember: z.number().positive(),
    startDate: z.string().datetime(),
    releaseDate: z.string().datetime(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    { message: "Start date can't be in the past.", path: ["startDate"] }
  );

export type CreateSinkingFundInput = z.infer<typeof createSinkingFundSchema>;

export const addMemberSchema = z
  .object({
    employeeId: z.string().optional(),
    manualFirstName: z.string().min(1).optional(),
    manualLastName: z.string().min(1).optional(),
    manualMobile: z.string().min(1).optional(),
    manualEmail: z.string().email().optional(),
  })
  .refine((data) => !!data.employeeId !== !!(data.manualFirstName && data.manualLastName), {
    message: "Provide either an employeeId or a first and last name, not both.",
  });

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const setContributionPaidSchema = z.object({
  paid: z.boolean(),
});

export type SetContributionPaidInput = z.infer<typeof setContributionPaidSchema>;
