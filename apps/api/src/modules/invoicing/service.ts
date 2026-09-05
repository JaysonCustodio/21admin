import type { FastifyInstance } from "fastify";
import type { Customer, Prisma } from "@business-platform/db";
import type { CreateCustomerInput, CreateInvoiceInput, UpdateInvoiceStatusInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const INVOICE_INCLUDE = {
  customer: true,
  lineItems: true,
} as const;

type InvoiceWithDetails = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_INCLUDE }>;

export function createCustomer(app: FastifyInstance, companyId: string, input: CreateCustomerInput): Promise<Customer> {
  return app.prisma.customer.create({ data: { companyId, name: input.name, email: input.email } });
}

export function listCustomers(app: FastifyInstance, companyId: string): Promise<Customer[]> {
  return app.prisma.customer.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function createInvoice(
  app: FastifyInstance,
  companyId: string,
  input: CreateInvoiceInput
): Promise<InvoiceWithDetails> {
  const customer = await app.prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer || customer.companyId !== companyId) {
    throw new HttpError("Customer not found.", 404);
  }

  return app.prisma.invoice.create({
    data: {
      companyId,
      customerId: input.customerId,
      dueDate: new Date(input.dueDate),
      lineItems: { create: input.lineItems },
    },
    include: INVOICE_INCLUDE,
  });
}

export function listInvoices(app: FastifyInstance, companyId: string): Promise<InvoiceWithDetails[]> {
  return app.prisma.invoice.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: INVOICE_INCLUDE,
  });
}

export async function updateInvoiceStatus(
  app: FastifyInstance,
  companyId: string,
  invoiceId: string,
  input: UpdateInvoiceStatusInput
): Promise<InvoiceWithDetails> {
  const invoice = await app.prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.companyId !== companyId) {
    throw new HttpError("Invoice not found.", 404);
  }

  return app.prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: input.status },
    include: INVOICE_INCLUDE,
  });
}
