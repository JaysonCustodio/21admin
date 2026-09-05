export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
}

export interface InvoiceWithDetails extends Invoice {
  customer: Customer;
  lineItems: InvoiceLineItem[];
}
