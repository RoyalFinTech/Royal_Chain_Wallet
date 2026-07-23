/**
 * Audit logging (Module 9).
 *
 * Every privileged/security-relevant client action funnels through here.
 * Today it sinks to console + a bounded localStorage ring buffer (visible
 * to nothing but the device itself); once the `audit_logs` table
 * (Module 2) is connected, the sink becomes a Supabase insert and every
 * call site is unchanged.
 */

export interface AuditEntry {
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface AuditSink {
  record(entry: Omit<AuditEntry, "timestamp">): void;
  recent(limit?: number): AuditEntry[];
}

const STORAGE_KEY = "rcw.audit-log";
const MAX_ENTRIES = 200;

class LocalAuditSink implements AuditSink {
  record(entry: Omit<AuditEntry, "timestamp">): void {
    const full: AuditEntry = { ...entry, timestamp: Date.now() };
    console.info(`[audit] ${full.action}`, full.target ?? "", full.metadata ?? "");
    if (typeof window === "undefined") return;
    const existing = this.recent(MAX_ENTRIES - 1);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([full, ...existing]));
  }

  recent(limit = 50): AuditEntry[] {
    if (typeof window === "undefined") return [];
    try {
      const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as AuditEntry[];
      return all.slice(0, limit);
    } catch {
      return [];
    }
  }
}

export const auditSink: AuditSink = new LocalAuditSink();

/** Convenience wrapper matching common call sites (PIN changes, exports, connects). */
export function logSecurityEvent(
  action: string,
  target?: string,
  metadata?: Record<string, unknown>,
) {
  auditSink.record({ action, target, metadata });
}
