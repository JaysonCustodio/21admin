export const CURRENCIES = ["USD", "EUR", "GBP", "PHP", "JPY", "AUD", "CAD", "SGD", "INR", "CNY"] as const;

export type Currency = (typeof CURRENCIES)[number];
