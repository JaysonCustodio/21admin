"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

export function InventoryPanel() {
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  function loadItems() {
    apiClient
      .get<{ items: InventoryItem[] }>("/api/inventory")
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }

  useEffect(loadItems, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !quantity) {
      setError("Fill in all fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/inventory", { sku, name, quantity: Number(quantity) });
      setSku("");
      setName("");
      setQuantity("");
      setIsCreating(false);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong adding this item.");
    } finally {
      setIsSubmitting(false);
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New item</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="item-sku" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                SKU
              </label>
              <input
                id="item-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="item-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <input
                id="item-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Office chair"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="item-quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantity
              </label>
              <input
                id="item-quantity"
                type="number"
                min={0}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add item"}
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
          New item
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
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items === null && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {items !== null && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No items yet.
                  </td>
                </tr>
              )}
              {items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">{item.sku}</td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
