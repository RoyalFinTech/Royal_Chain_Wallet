/**
 * Session management (Module 4).
 *
 * Client-side session/activity tracking ahead of a real backend session
 * table (see supabase/migrations — sessions). This gives the app a real
 * idle-timeout and "last activity" concept today; once Authentication is
 * wired, ExpiringSessionStore is replaced by a server-backed
 * implementation of the same SessionStore interface.
 */

export interface SessionInfo {
  startedAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface SessionStore {
  start(ttlMs: number): SessionInfo;
  touch(): SessionInfo | null;
  isExpired(): boolean;
  clear(): void;
  current(): SessionInfo | null;
}

const STORAGE_KEY = "rcw.session";
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 min idle timeout

class LocalSessionStore implements SessionStore {
  start(ttlMs: number = DEFAULT_TTL_MS): SessionInfo {
    const now = Date.now();
    const info: SessionInfo = { startedAt: now, lastActivityAt: now, expiresAt: now + ttlMs };
    this.persist(info);
    return info;
  }

  touch(): SessionInfo | null {
    const info = this.current();
    if (!info) return null;
    const ttl = info.expiresAt - info.lastActivityAt;
    const now = Date.now();
    const updated: SessionInfo = { ...info, lastActivityAt: now, expiresAt: now + ttl };
    this.persist(updated);
    return updated;
  }

  isExpired(): boolean {
    const info = this.current();
    return !info || Date.now() > info.expiresAt;
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  current(): SessionInfo | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionInfo;
    } catch {
      return null;
    }
  }

  private persist(info: SessionInfo) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  }
}

export const sessionStore: SessionStore = new LocalSessionStore();
export { DEFAULT_TTL_MS as DEFAULT_SESSION_TTL_MS };
