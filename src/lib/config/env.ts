/**
 * Typed environment configuration with runtime validation.
 *
 * Every value is a placeholder until later integration phases supply real
 * credentials. Nothing here throws at import time in the browser — missing
 * values resolve to `undefined` and callers use `isConfigured()` checks
 * before attempting live calls, so the app runs fully on mock data until
 * real secrets are provided.
 *
 * IMPORTANT: only VITE_-prefixed vars are available client-side (Vite
 * convention). Server-only secrets (never prefixed VITE_) must be read in
 * server functions/routes only, never imported into client bundles.
 */
import { z } from "zod";

const envSchema = z.object({
  // --- Supabase (already provisioned by the platform; see .env) ---
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

  // --- Blockchain RPC endpoints (Module 6 / Phase 8B+) ---
  VITE_SOL_RPC_URL: z.string().url().optional(),
  VITE_ETH_RPC_URL: z.string().url().optional(),
  VITE_BNB_RPC_URL: z.string().url().optional(),
  VITE_BTC_API_URL: z.string().url().optional(),
  VITE_POLYGON_RPC_URL: z.string().url().optional(),
  VITE_BASE_RPC_URL: z.string().url().optional(),

  // --- Token contracts (Module 7) ---
  VITE_ROY_MINT: z.string().optional(),
  VITE_USDT_MINT: z.string().optional(),
  VITE_USDC_MINT: z.string().optional(),

  // --- Royal Chain backend API (Module 8) ---
  VITE_API_BASE_URL: z.string().url().optional(),

  // --- Pricing / market data provider (currency + price service) ---
  VITE_PRICE_PROVIDER_URL: z.string().url().optional(),
  VITE_PRICE_PROVIDER_API_KEY: z.string().optional(),

  // --- Push / notifications (Module 8, later phase) ---
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),

  // --- Feature flags (comma-separated overrides, optional) ---
  VITE_FEATURE_FLAGS: z.string().optional(),

  // --- App metadata ---
  VITE_APP_ENV: z.enum(["development", "staging", "production"]).optional(),

  // --- WalletConnect / Reown (wallet-side pairing with dapps) ---
  VITE_WALLETCONNECT_PROJECT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function readRawEnv(): Record<string, string | undefined> {
  // import.meta.env is Vite's client-safe env object.
  return (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};
}

let cached: Env | null = null;

/**
 * Parsed, validated environment. Safe to call anywhere on the client.
 * Unset values are `undefined` rather than throwing — this is a
 * pre-integration phase and most values are expected to be unset.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(readRawEnv());
  if (!result.success) {
    // Malformed (not missing) values are a real bug worth surfacing loudly.
    console.error("[config] Invalid environment variables:", result.error.flatten().fieldErrors);
    cached = envSchema.parse({}); // fall back to all-undefined rather than crash the app
  } else {
    cached = result.data;
  }
  return cached;
}

/** True once a given env var is set to a non-empty value. */
export function isConfigured(key: keyof Env): boolean {
  const value = getEnv()[key];
  return typeof value === "string" && value.length > 0;
}

export const APP_ENV = getEnv().VITE_APP_ENV ?? "development";
