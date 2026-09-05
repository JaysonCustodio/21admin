export interface Company {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  address: string | null;
  country: string | null;
  defaultCurrency: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  taxId: string | null;
  contactEmail: string | null;
}
