/**
 * Feature flags.
 *
 * Defaults are hardcoded here (safe, non-secret) and can be overridden via
 * VITE_FEATURE_FLAGS="flagA,flagB" for staged rollouts without a redeploy
 * of flag logic. This is intentionally simple — no remote flag service
 * yet (that's a later integration phase).
 */
import { getEnv } from "./env";

export type FeatureFlag =
  | "live_rpc" // real blockchain RPC calls instead of mock data
  | "live_pricing" // real market price feed instead of mock data
  | "push_notifications"
  | "biometric_auth"
  | "multi_wallet"
  | "i18n"
  | "kyc";

const DEFAULTS: Record<FeatureFlag, boolean> = {
  live_rpc: false,
  live_pricing: false,
  push_notifications: false,
  biometric_auth: true, // UI toggle only until a real platform API is wired
  multi_wallet: true,
  i18n: true,
  kyc: false,
};

function overridesFromEnv(): Set<string> {
  const raw = getEnv().VITE_FEATURE_FLAGS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const overrides = overridesFromEnv();
  if (overrides.has(flag)) return true;
  if (overrides.has(`-${flag}`)) return false; // explicit disable
  return DEFAULTS[flag];
}

export function allFeatureFlags(): Record<FeatureFlag, boolean> {
  return Object.fromEntries(
    (Object.keys(DEFAULTS) as FeatureFlag[]).map((f) => [f, isFeatureEnabled(f)]),
  ) as Record<FeatureFlag, boolean>;
}
