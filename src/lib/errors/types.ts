/**
 * Structured application error types (Module 11).
 * Every thrown error in a service layer should be one of these so the UI
 * can branch on `.code` instead of parsing message strings.
 */

export type ErrorCode =
  | "network_error"
  | "timeout"
  | "offline"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "insufficient_funds"
  | "invalid_pin"
  | "rate_limited"
  | "not_configured" // hit a feature gated behind an unset env var
  | "unknown_error";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends AppError {
  constructor(message = "Network request failed.", details?: Record<string, unknown>) {
    super("network_error", message, details);
    this.name = "NetworkError";
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message = "Insufficient balance for this transaction.") {
    super("insufficient_funds", message);
    this.name = "InsufficientFundsError";
  }
}

export class InvalidPinError extends AppError {
  constructor(message = "Incorrect PIN.") {
    super("invalid_pin", message);
    this.name = "InvalidPinError";
  }
}

export class NotConfiguredError extends AppError {
  constructor(feature: string) {
    super("not_configured", `${feature} is not yet configured. Running on mock data.`);
    this.name = "NotConfiguredError";
  }
}

/** Normalizes any thrown value into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError("unknown_error", err.message);
  return new AppError("unknown_error", "An unexpected error occurred.");
}
