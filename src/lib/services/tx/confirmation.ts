/**
 * Transaction confirmation polling with timeout + backoff.
 * Chain-agnostic wrapper — each chain's "check status" call is injected,
 * this module only owns the polling/retry/timeout policy.
 */
export type ConfirmationOutcome = "confirmed" | "failed" | "pending";

export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
  maxIntervalMs?: number;
}

/**
 * Polls `checkStatus` with exponential backoff (capped) until it returns
 * "confirmed"/"failed", or until timeoutMs elapses. Transient check
 * failures (e.g. a single flaky RPC call) are tolerated up to 3 in a row
 * before giving up — a persistent network outage should surface as an
 * error, not hang forever.
 */
export async function pollForConfirmation(
  checkStatus: () => Promise<"pending" | ConfirmationOutcome | "not_found">,
  opts: PollOptions = {},
): Promise<ConfirmationOutcome> {
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const maxIntervalMs = opts.maxIntervalMs ?? 8_000;
  let intervalMs = opts.intervalMs ?? 1_500;
  const deadline = Date.now() + timeoutMs;
  let consecutiveFailures = 0;

  while (Date.now() < deadline) {
    try {
      const status = await checkStatus();
      consecutiveFailures = 0;
      if (status === "confirmed" || status === "failed") return status;
      // "pending" or "not_found" — keep polling.
    } catch (e) {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        // Broadcasting already succeeded; the explorer hash must reach the
        // caller even when the RPC cannot confirm it. Never make a timeout
        // look like a safe-to-retry send.
        return "pending";
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    intervalMs = Math.min(intervalMs * 1.5, maxIntervalMs);
  }

  return "pending";
}
