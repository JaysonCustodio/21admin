import { z } from "zod";
import { CURRENCIES } from "@business-platform/shared-types";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Must be a hex color like #1A2634");

// update fields are nullable (send null to clear) and optional (omit to leave untouched)
export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  primaryColor: hexColor.nullable().optional(),
  address: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
  defaultCurrency: z.enum(CURRENCIES).optional(),
  phone: z.string().min(1).nullable().optional(),
  website: z.string().min(1).nullable().optional(),
  industry: z.string().min(1).nullable().optional(),
  taxId: z.string().min(1).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
