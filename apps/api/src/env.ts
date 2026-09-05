import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().default("http://localhost:4000"),
  WEB_APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // optional — nothing calls the Stripe SDK yet (the webhook route is a stub),
  // and the BullMQ queue workers that would need Redis are never imported
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  // optional until the owner links a real Xendit account — GCash checkout/payout
  // is disabled (not a startup error) when these are unset
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
  XENDIT_PAYOUT_GCASH_NUMBER: z.string().optional(),
  // optional — uploads fall back to local disk when unset, which is fine for
  // local dev but doesn't survive a redeploy on a host with an ephemeral disk
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
