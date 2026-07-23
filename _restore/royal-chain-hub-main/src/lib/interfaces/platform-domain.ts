/**
 * Backend service interfaces — platform domain (Module 3, continued).
 * Notifications, security, auth, admin, treasury, fraud, analytics.
 */
import type {
  NotificationRecord,
  SessionRecord,
  DeviceRecord,
  UserRecord,
  AdminUserRecord,
  TreasuryPoolRecord,
  FraudCaseRecord,
  AnalyticsEventRecord,
  AuditLogRecord,
} from "@/lib/db/models";
import type { AdminRoleKey } from "@/lib/db/models";

export interface NotificationService {
  list(
    userId: string,
    opts?: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationRecord[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  send(
    userId: string,
    notification: Pick<NotificationRecord, "kind" | "title" | "body">,
  ): Promise<NotificationRecord>;
  registerPushToken(deviceId: string, token: string): Promise<void>;
}

export interface SecurityService {
  getSessions(userId: string): Promise<SessionRecord[]>;
  revokeSession(sessionId: string): Promise<void>;
  getDevices(userId: string): Promise<DeviceRecord[]>;
  trustDevice(deviceId: string): Promise<void>;
  removeDevice(deviceId: string): Promise<void>;
  getSecurityScore(userId: string): Promise<number>; // 0-100
  recordFailedLogin(userId: string): Promise<{ locked: boolean; attemptsRemaining: number }>;
}

export interface AuthenticationService {
  signUp(email: string, password: string): Promise<UserRecord>;
  signIn(email: string, password: string): Promise<{ user: UserRecord; sessionToken: string }>;
  signOut(sessionToken: string): Promise<void>;
  verifyPin(userId: string, pin: string): Promise<boolean>;
  changePin(userId: string, oldPin: string, newPin: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  enableBiometrics(userId: string, deviceId: string): Promise<void>;
}

export interface AdminService {
  listAdmins(): Promise<AdminUserRecord[]>;
  inviteAdmin(email: string, role: AdminRoleKey): Promise<AdminUserRecord>;
  updateAdminRole(adminId: string, role: AdminRoleKey): Promise<AdminUserRecord>;
  deactivateAdmin(adminId: string): Promise<void>;
  logAction(
    entry: Pick<AuditLogRecord, "actor_admin_id" | "action" | "target" | "metadata">,
  ): Promise<AuditLogRecord>;
  getAuditLog(opts?: { limit?: number; actorAdminId?: string }): Promise<AuditLogRecord[]>;
}

export interface TreasuryService {
  getPools(): Promise<TreasuryPoolRecord[]>;
  recordInflow(assetId: string, amount: number, usdValue: number): Promise<TreasuryPoolRecord>;
  recordOutflow(assetId: string, amount: number, usdValue: number): Promise<TreasuryPoolRecord>;
  getTotalReservesUsd(): Promise<number>;
}

export interface FraudService {
  listCases(opts?: { status?: FraudCaseRecord["status"] }): Promise<FraudCaseRecord[]>;
  flagUser(userId: string, reason: string, amountUsd?: number): Promise<FraudCaseRecord>;
  resolveCase(caseId: string): Promise<FraudCaseRecord>;
  scoreTransaction(transactionId: string): Promise<{ riskScore: number; reasons: string[] }>;
}

export interface AnalyticsService {
  track(event: Pick<AnalyticsEventRecord, "user_id" | "event_name" | "properties">): Promise<void>;
  getDailyActiveUsers(days: number): Promise<{ date: string; count: number }[]>;
  getVolumeByChain(days: number): Promise<Record<string, number>>;
}
