/**
 * Admin-domain repository interfaces (Module 10).
 * One interface per admin section; DashboardRepository aggregates
 * read-only summaries across the others for the overview screen.
 */
import type {
  UserRecord,
  TransactionRecord,
  TreasuryPoolRecord,
  AnalyticsEventRecord,
  FraudCaseRecord,
  AuditLogRecord,
  SettingRecord,
  RoleRecord,
  PermissionRecord,
} from "@/lib/db/models";
import type { PagedResult } from "./types";

export interface UsersRepository {
  list(opts?: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<UserRecord>>;
  flag(userId: string, reason: string): Promise<UserRecord>;
  verifyKyc(userId: string): Promise<UserRecord>;
}

export interface TreasuryRepository {
  getPools(): Promise<TreasuryPoolRecord[]>;
  getTotalReservesUsd(): Promise<number>;
}

export interface AnalyticsRepository {
  recentEvents(limit?: number): Promise<AnalyticsEventRecord[]>;
  dailyActiveUsers(days: number): Promise<{ date: string; count: number }[]>;
}

export interface SecurityRepository {
  recentEvents(
    limit?: number,
  ): Promise<{ actor: string; action: string; risk: "low" | "medium" | "high"; at: string }[]>;
}

export interface AuditRepository {
  list(opts?: { limit?: number }): Promise<AuditLogRecord[]>;
  record(entry: Omit<AuditLogRecord, "id" | "created_at">): Promise<AuditLogRecord>;
}

export interface FraudRepository {
  listCases(status?: FraudCaseRecord["status"]): Promise<FraudCaseRecord[]>;
  resolveCase(caseId: string): Promise<FraudCaseRecord>;
}

export interface SettingsRepository {
  get(key: string): Promise<SettingRecord | null>;
  set(key: string, value: unknown): Promise<SettingRecord>;
}

export interface PermissionsRepository {
  listRoles(): Promise<RoleRecord[]>;
  listPermissions(): Promise<PermissionRecord[]>;
  permissionsForRole(roleId: string): Promise<PermissionRecord[]>;
}

export interface DashboardRepository {
  getSummary(): Promise<{
    totalUsers: number;
    volume24hUsd: number;
    transactions24h: number;
    flaggedCount: number;
    recentTransactions: TransactionRecord[];
  }>;
}
