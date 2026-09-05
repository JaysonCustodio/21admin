import type { Currency } from "./currency";

// curated list of countries mapped to one of the supported CURRENCIES —
// picking a country auto-selects a sensible default currency for the company
export const COUNTRY_CURRENCY: Record<string, Currency> = {
  "United States": "USD",
  "United Kingdom": "GBP",
  Philippines: "PHP",
  Japan: "JPY",
  Australia: "AUD",
  Canada: "CAD",
  Singapore: "SGD",
  India: "INR",
  China: "CNY",
  Germany: "EUR",
  France: "EUR",
  Spain: "EUR",
  Italy: "EUR",
  Netherlands: "EUR",
  Ireland: "EUR",
  Portugal: "EUR",
  Belgium: "EUR",
  Austria: "EUR",
  Finland: "EUR",
  Greece: "EUR",
};

export const COUNTRIES = Object.keys(COUNTRY_CURRENCY) as (keyof typeof COUNTRY_CURRENCY)[];

export type Country = (typeof COUNTRIES)[number];
