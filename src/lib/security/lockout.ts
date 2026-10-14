/**
 * Failed-login / brute-force protection (Module 9).
 *
 * The PIN lockout is client-side because the PIN unlocks locally encrypted
 * wallet material. Server-side transaction rate limiting is enforced by
 * Postgres and must fail closed when that security control is unavailable.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

const STORAGE_KEY = "rcw.lockout";
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30s, doubles each additional lockout

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  lockoutCount: number;
}

function read(): LockoutState {
  if (typeof window === "undefined") return { attempts: 0, lockedUntil: null, lockoutCount: 0 };
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "") as LockoutState;
  } catch {
    return { attempts: 0, lockedUntil: null, lockoutCount: 0 };
  }
}

function write(state: LockoutState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export interface LockoutStatus {
  locked: boolean;
  attemptsRemaining: number;
  lockedUntil: number | null;
}

export function getLockoutStatus(): LockoutStatus {
  const state = read();
  const locked = !!state.lockedUntil && Date.now() < state.lockedUntil;
  return {
    locked,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.attempts),
    lockedUntil: locked ? state.lockedUntil : null,
  };
}

/** Call after a failed PIN attempt. Returns the resulting lockout status. */
export function recordFailedAttempt(): LockoutStatus {
  const state = read();
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const lockoutCount = state.lockoutCount + 1;
    const lockedUntil = Date.now() + BASE_LOCKOUT_MS * 2 ** (lockoutCount - 1);
    write({ attempts: 0, lockedUntil, lockoutCount });
    return { locked: true, attemptsRemaining: 0, lockedUntil };
  }
  write({ ...state, attempts });
  return { locked: false, attemptsRemaining: MAX_ATTEMPTS - attempts, lockedUntil: null };
}

/** Call after a successful PIN attempt to reset the counter. */
export function clearLockout() {
  write({ attempts: 0, lockedUntil: null, lockoutCount: 0 });
}

/**
 * Server-enforced transaction rate limit. The authenticated request client
 * is passed in explicitly; never use a cached anonymous client here because
 * the database function must bind its quota bucket to auth.uid().
 *
 * Throws on RPC failure. Callers must not interpret an unavailable limiter
 * as permission to record a financial transaction.
 */
export async function checkServerRateLimit(
  db: SupabaseClient<Database>,
  bucketKey: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] check_rate_limit RPC failed; blocking transaction:", error.message);
    throw new Error("Transaction rate limiting is unavailable. No transaction was recorded.");
  }

  if (typeof data !== "boolean") {
    console.error("[rate-limit] check_rate_limit returned an invalid response.");
    throw new Error("Transaction rate limiting is unavailable. No transaction was recorded.");
  }

  return data;
}
