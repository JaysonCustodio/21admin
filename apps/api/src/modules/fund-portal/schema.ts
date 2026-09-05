import { z } from "zod";

export const fundLoginSchema = z.object({
  memberCode: z.string().min(1),
  password: z.string().min(1),
});

export type FundLoginInput = z.infer<typeof fundLoginSchema>;

export const fundChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type FundChangePasswordInput = z.infer<typeof fundChangePasswordSchema>;
