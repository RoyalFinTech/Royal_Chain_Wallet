/**
 * Global error handling + retry logic (Module 11).
 */
import { toast } from "sonner";
import { AppError, NetworkError, toAppError } from "./types";

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: AppError) => void;
}

/** Exponential backoff retry wrapper for any async operation. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 2, baseDelayMs = 400, onRetry } = opts;
  let lastError: AppError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = toAppError(e);
      const nonRetryable: Array<AppError["code"]> = [
        "unauthorized",
        "forbidden",
        "validation_error",
        "insufficient_funds",
        "invalid_pin",
      ];
      if (nonRetryable.includes(lastError.code) || attempt === retries) throw lastError;
      onRetry?.(attempt + 1, lastError);
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError ?? new NetworkError();
}

/** Consistent user-facing error surface: log + toast. Call from any catch block. */
export function reportError(err: unknown, opts?: { title?: string; silent?: boolean }) {
  const appErr = toAppError(err);
  console.error(`[${appErr.code}]`, appErr.message, appErr.details ?? "");
  if (!opts?.silent) {
    toast.error(opts?.title ?? friendlyTitle(appErr.code), { description: appErr.message });
  }
  return appErr;
}

function friendlyTitle(code: AppError["code"]): string {
  switch (code) {
    case "network_error":
      return "Connection problem";
    case "timeout":
      return "Request timed out";
    case "offline":
      return "You're offline";
    case "unauthorized":
      return "Session expired";
    case "forbidden":
      return "Not allowed";
    case "not_found":
      return "Not found";
    case "validation_error":
      return "Check your input";
    case "insufficient_funds":
      return "Insufficient balance";
    case "invalid_pin":
      return "Incorrect PIN";
    case "rate_limited":
      return "Too many requests";
    case "not_configured":
      return "Feature not yet available";
    default:
      return "Something went wrong";
  }
}
