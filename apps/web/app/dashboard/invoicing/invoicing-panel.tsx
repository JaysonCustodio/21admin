"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import type { Customer, InvoiceWithDetails, InvoiceStatus } from "@business-platform/shared-types";
import { INVOICE_STATUSES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

interface LineItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_LINE_ITEM: LineItemDraft = { description: "", quantity: "1", unitPrice: "" };

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  SENT: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  VOID: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500",
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function invoiceTotal(invoice: InvoiceWithDetails): number {
  return invoice.lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
}

export function InvoicingPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[] | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([{ ...EMPTY_LINE_ITEM }]);
  const [error, setError] = useState<string | null>(null);

  function loadInvoices() {
    apiClient
      .get<{ invoices: InvoiceWithDetails[] }>("/api/invoices")
      .then((data) => setInvoices(data.invoices))
      .catch(() => setInvoices([]));
  }

  function loadCustomers() {
    apiClient
      .get<{ customers: Customer[] }>("/api/customers")
      .then((data) => setCustomers(data.customers))
      .catch(() => setCustomers([]));
  }

  useEffect(loadInvoices, []);
  useEffect(loadCustomers, []);

  function updateLineItem(index: number, patch: Partial<LineItemDraft>) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!dueDate || lineItems.some((item) => !item.description || !item.quantity || !item.unitPrice)) {
      setError("Fill in the due date and every line item.");
      return;
    }
    if (!customerId && !newCustomerName.trim()) {
      setError("Pick a customer or enter a new one.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId) {
        const { customer } = await apiClient.post<{ customer: Customer }>("/api/customers", { name: newCustomerName });
        resolvedCustomerId = customer.id;
      }

      await apiClient.post("/api/invoices", {
        customerId: resolvedCustomerId,
        dueDate: new Date(dueDate).toISOString(),
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });

      setCustomerId("");
      setNewCustomerName("");
      setDueDate("");
      setLineItems([{ ...EMPTY_LINE_ITEM }]);
      setIsCreating(false);
      loadInvoices();
      loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating this invoice.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(invoiceId: string, status: InvoiceStatus) {
    try {
      await apiClient.patch(`/api/invoices/${invoiceId}`, { status });
      loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that invoice.");
    }
  }

  return (
    <div className="space-y-4">
      {isCreating ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New invoice</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="invoice-customer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Customer
              </label>
              <select
                id="invoice-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">New customer…</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {!customerId && (
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              )}
            </div>
            <div>
              <label htmlFor="invoice-due" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Due date
              </label>
              <input
                id="invoice-due"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Line items</h4>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, { description: e.target.value })}
                    placeholder="Description"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, { quantity: e.target.value })}
                    placeholder="Qty"
                    className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, { unitPrice: e.target.value })}
                    placeholder="Unit price"
                    className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create invoice"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </button>
      )}

      {!isCreating && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Due date</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {invoices === null && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {invoices !== null && invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No invoices yet.
                  </td>
                </tr>
              )}
              {invoices?.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{invoice.customer.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(invoiceTotal(invoice), defaultCurrency)}</td>
                  <td className="px-4 py-2">
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value as InvoiceStatus)}
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${STATUS_STYLES[invoice.status]}`}
                    >
                      {INVOICE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
