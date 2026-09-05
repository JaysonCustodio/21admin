import { z } from "zod";
import { LOAN_FUND_SOURCES, LOAN_BORROWER_TYPES } from "@business-platform/shared-types";

export const createLoanSchema = z
  .object({
    fundSource: z.enum(LOAN_FUND_SOURCES).default("PERSONAL"),
    sinkingFundId: z.string().optional(),
    borrowerType: z.enum(LOAN_BORROWER_TYPES),
    employeeId: z.string().optional(),
    sinkingFundMemberId: z.string().optional(),
    manualBorrowerName: z.string().min(1).optional(),
    principal: z.number().positive(),
    interestRate: z.number().min(0).max(100).default(0),
    termMonths: z.number().int().positive(),
  })
  .refine((data) => data.fundSource !== "SINKING_FUND" || !!data.sinkingFundId, {
    message: "Select which sinking fund this loan is funded from.",
    path: ["sinkingFundId"],
  })
  .refine((data) => data.borrowerType !== "EMPLOYEE" || !!data.employeeId, {
    message: "Select an employee.",
    path: ["employeeId"],
  })
  .refine((data) => data.borrowerType !== "FUND_MEMBER" || !!data.sinkingFundMemberId, {
    message: "Select a fund member.",
    path: ["sinkingFundMemberId"],
  })
  .refine((data) => data.borrowerType !== "MANUAL" || !!data.manualBorrowerName, {
    message: "Enter the borrower's name.",
    path: ["manualBorrowerName"],
  });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const recordRepaymentSchema = z.object({
  amount: z.number().positive(),
});

export type RecordRepaymentInput = z.infer<typeof recordRepaymentSchema>;
