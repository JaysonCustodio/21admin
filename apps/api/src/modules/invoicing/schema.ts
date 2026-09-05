import { z } from "zod";
import { INVOICE_STATUSES } from "@business-platform/shared-types";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const createInvoiceSchema = z.object({
  customerId: z.string(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
  dueDate: z.string().datetime(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
