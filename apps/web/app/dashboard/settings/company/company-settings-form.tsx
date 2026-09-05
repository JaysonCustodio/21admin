"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Company, Currency } from "@business-platform/shared-types";
import { COUNTRIES, COUNTRY_CURRENCY, CURRENCIES } from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import { AvatarUpload } from "@/components/ui/avatar-upload";

interface FormState {
  name: string;
  primaryColor: string;
  address: string;
  country: string;
  defaultCurrency: Currency;
  phone: string;
  website: string;
  industry: string;
  taxId: string;
  contactEmail: string;
}

const DEFAULT_COLOR = "#1A2634";

function toFormValues(company: Company): FormState {
  return {
    name: company.name,
    primaryColor: company.primaryColor ?? DEFAULT_COLOR,
    address: company.address ?? "",
    country: company.country ?? "",
    defaultCurrency: (company.defaultCurrency as Currency) ?? "USD",
    phone: company.phone ?? "",
    website: company.website ?? "",
    industry: company.industry ?? "",
    taxId: company.taxId ?? "",
    contactEmail: company.contactEmail ?? "",
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CompanySettingsForm() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ company: Company }>("/api/company")
      .then((data) => {
        setCompany(data.company);
        setForm(toFormValues(data.company));
      })
      .catch(() => setError("Couldn't load your company profile."));
  }, []);

  function field(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
  }

  function handleCountryChange(country: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const suggestedCurrency = COUNTRY_CURRENCY[country];
      return { ...prev, country, defaultCurrency: suggestedCurrency ?? prev.defaultCurrency };
    });
  }

  async function handleLogoSelected(file: File) {
    setError(null);
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { company: updated } = await apiClient.upload<{ company: Company }>("/api/company/logo", formData);
      setCompany(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong uploading the logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSaved(false);

    if (!form.name.trim()) {
      setError("Enter your company name.");
      return;
    }

    setIsSaving(true);
    try {
      const { company: updated } = await apiClient.patch<{ company: Company }>("/api/company", {
        name: form.name,
        primaryColor: form.primaryColor || null,
        address: form.address || null,
        country: form.country || null,
        defaultCurrency: form.defaultCurrency,
        phone: form.phone || null,
        website: form.website || null,
        industry: form.industry || null,
        taxId: form.taxId || null,
        contactEmail: form.contactEmail || null,
      });
      setCompany(updated);
      setForm(toFormValues(updated));
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving your company profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!company || !form) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
      noValidate
    >
      <AvatarUpload
        shape="square"
        size={72}
        imageUrl={company.logoUrl ? `${API_BASE_URL}${company.logoUrl}` : null}
        fallbackText={getInitials(company.name)}
        onFileSelected={handleLogoSelected}
        isUploading={isUploadingLogo}
        label="Company logo"
        helpText="JPEG, PNG, WebP, GIF or SVG. Max 5MB."
      />

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Brand color</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Used to color your dashboard&apos;s buttons, links, and highlights.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={form.primaryColor}
            onChange={field("primaryColor")}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 p-1 dark:border-slate-600"
            aria-label="Brand color picker"
          />
          <input
            type="text"
            value={form.primaryColor}
            onChange={field("primaryColor")}
            placeholder="#1A2634"
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Company details</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={field("name")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contact email
            </label>
            <input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={field("contactEmail")}
              placeholder="hello@acme.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={field("phone")}
              placeholder="+1 555 000 0000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Website
            </label>
            <input
              id="website"
              type="text"
              value={form.website}
              onChange={field("website")}
              placeholder="https://acme.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Industry
            </label>
            <input
              id="industry"
              type="text"
              value={form.industry}
              onChange={field("industry")}
              placeholder="Software"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tax ID
            </label>
            <input
              id="taxId"
              type="text"
              value={form.taxId}
              onChange={field("taxId")}
              placeholder="12-3456789"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={form.address}
              onChange={field("address")}
              placeholder="123 Main St, City, Country"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Country
            </label>
            <select
              id="country"
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select…</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="defaultCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Default currency
            </label>
            <select
              id="defaultCurrency"
              value={form.defaultCurrency}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, defaultCurrency: e.target.value as Currency } : prev))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Used as the default currency across payroll, loans, and invoicing.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}
      {saved && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Saved.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
