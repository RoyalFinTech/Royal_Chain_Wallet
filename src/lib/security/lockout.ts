/**
 * Failed-login / brute-force protection (Module 9).
 *
 * Client-side rate limiting for PIN attempts. This is a real defense
 * layer today (it already stops rapid brute-forcing of the on-device PIN
 * before every attempt hits crypto.subtle) and maps directly onto the
 * `sessions`/`devices` server-side tracking once Authentication is wired
 * — same escalation curve, just also enforced server-side at that point.
 */

const STORAGE_KEY = "rcw.lockout";
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30s, doubles each additional lockout

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  lockoutCount: number; // how many times we've locked out, for escalating backoff
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
 * Server-enforced rate limiting via the `check_rate_limit` Postgres
 * function (supabase/migrations/00000000000002_rate_limiting.sql).
 * Complements the client-side lockout above: the client-side check stops
 * obvious brute-forcing instantly with zero network round-trip, while
 * this is the real enforcement point that applies no matter which
 * client calls in (web app, MCP server, a future mobile app).
 */
export async function checkServerRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const { getTypedSupabase } = await import("@/lib/db/typed-client");
  const db = getTypedSupabase();
  const { data, error } = await db.rpc("check_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail open with a warning rather than blocking all traffic if the
    // rate-limit migration/function isn't deployed yet — this must never
    // become the reason a legitimate user is locked out.
    console.warn("[rate-limit] check_rate_limit RPC unavailable, failing open:", error.message);
    return true;
  }
  return data;
}
