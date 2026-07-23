/**
 * Typed API client (Module 8).
 *
 * Every method returns typed data or throws an AppError. Base URL comes
 * from VITE_API_BASE_URL; until that's set, isApiConfigured() is false
 * and callers (once wired in a later phase) should fall back to the
 * mock services in src/lib/services/* — exactly how the app behaves
 * today.
 */
import { getEnv, isConfigured } from "@/lib/config/env";
import { withRetry } from "@/lib/errors/handler";
import { AppError, NetworkError, NotConfiguredError, toAppError } from "@/lib/errors/types";
import type { ApiEnvelope, ApiErrorBody } from "./types";

export function isApiConfigured(): boolean {
  return isConfigured("VITE_API_BASE_URL");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { VITE_API_BASE_URL } = getEnv();
  if (!VITE_API_BASE_URL) {
    throw new NotConfiguredError("Royal Chain backend API");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);

  try {
    const res = await fetch(`${VITE_API_BASE_URL}${path}`, {
      method: opts.method ?? "GET",
      headers: { "Content-Type": "application/json", ...opts.headers },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let body: ApiErrorBody | null = null;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        // non-JSON error body — fall through to generic handling
      }
      if (res.status === 401)
        throw new AppError("unauthorized", body?.error.message ?? "Session expired.");
      if (res.status === 403)
        throw new AppError("forbidden", body?.error.message ?? "Not allowed.");
      if (res.status === 404) throw new AppError("not_found", body?.error.message ?? "Not found.");
      if (res.status === 422)
        throw new AppError("validation_error", body?.error.message ?? "Invalid request.");
      if (res.status === 429)
        throw new AppError("rate_limited", body?.error.message ?? "Too many requests.");
      throw new NetworkError(body?.error.message ?? `Request failed with status ${res.status}.`);
    }

    const envelope = (await res.json()) as ApiEnvelope<T>;
    return envelope.data;
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e instanceof DOMException && e.name === "AbortError")
      throw new AppError("timeout", "Request timed out.");
    throw toAppError(e);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Public entry point — wraps `request` with retry-with-backoff for
 * transient network failures. Non-retryable errors (auth, validation,
 * etc.) surface immediately.
 */
export const apiClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    withRetry(() => request<T>(path, { ...opts, method: "GET" })),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    withRetry(() => request<T>(path, { ...opts, method: "POST", body })),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    withRetry(() => request<T>(path, { ...opts, method: "PUT", body })),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    withRetry(() => request<T>(path, { ...opts, method: "PATCH", body })),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    withRetry(() => request<T>(path, { ...opts, method: "DELETE" })),
};
