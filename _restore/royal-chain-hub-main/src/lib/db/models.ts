/**
 * Typed models mirroring supabase/migrations/00000000000001_royal_chain_core_schema.sql
 *
 * These are plain TypeScript interfaces — no ORM, no live queries. They
 * exist so services/repositories (Modules 3 & 10) can be fully typed
 * against the future schema before a database connection exists.
 */

export type ChainName = "bitcoin" | "ethereum" | "bnb" | "solana";
export type KycStatus = "none" | "pending" | "verified" | "rejected";
export type TxDirection = "in" | "out";
export type TxKind =
  | "transfer"
  | "swap"
  | "stake"
  | "unstake"
  | "reward"
  | "fee"
  | "deposit"
  | "withdrawal"
  | "merchant_payment"
  | "refund"
  | "reversal";
export type TxStatus = "pending" | "confirmed" | "failed";
export type StakingStatus = "active" | "unstaking" | "withdrawn";
export type FraudSeverity = "low" | "medium" | "high";
export type FraudStatus = "open" | "reviewing" | "resolved";
export type AdminRoleKey = "super_admin" | "finance" | "compliance" | "technical";
export type NotificationKind = "transaction" | "price" | "security" | "system";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type TokenStandard = "native" | "spl" | "erc20" | "bep20";

interface Timestamped {
  created_at: string; // ISO 8601
}

export interface UserRecord extends Timestamped {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  preferred_currency: string;
  preferred_locale: string;
  kyc_status: KycStatus;
  updated_at: string;
}

export interface DeviceRecord extends Timestamped {
  id: string;
  user_id: string;
  device_name: string | null;
  platform: "ios" | "android" | "web" | null;
  fingerprint: string | null;
  push_token: string | null;
  is_trusted: boolean;
  last_seen_at: string | null;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  device_id: string | null;
  ip_address: string | null;
  location: string | null;
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface WalletRecord extends Timestamped {
  id: string;
  user_id: string;
  label: string;
  is_primary: boolean;
}

export interface WalletAccountRecord extends Timestamped {
  id: string;
  wallet_id: string;
  chain: ChainName;
  address: string;
  derivation_path: string;
}

export interface AssetRecord {
  id: string;
  symbol: string;
  name: string;
  chain: ChainName;
  standard: TokenStandard;
  decimals: number;
  contract_address: string | null;
  icon_gradient: string | null;
  is_active: boolean;
}

export interface BalanceRecord {
  id: string;
  wallet_account_id: string;
  asset_id: string;
  amount: string; // numeric(38,18) surfaces as string over the wire
  usd_value: string;
  updated_at: string;
}

export interface TransactionRecord extends Timestamped {
  id: string;
  wallet_id: string;
  asset_id: string;
  chain: ChainName;
  direction: TxDirection;
  kind: TxKind;
  amount: string;
  usd_value: string | null;
  fee_usd: string | null;
  counterparty_address: string | null;
  tx_hash: string | null;
  status: TxStatus;
  memo: string | null;
  confirmed_at: string | null;
}

export interface SwapHistoryRecord extends Timestamped {
  id: string;
  wallet_id: string;
  from_asset_id: string;
  to_asset_id: string;
  from_amount: string;
  to_amount: string;
  rate: string;
  slippage_pct: string;
  network_fee_usd: string | null;
  tx_hash: string | null;
  status: TxStatus;
}

export interface ValidatorRecord {
  id: string;
  name: string;
  chain: ChainName;
  apy_pct: string;
  commission_pct: string;
  uptime_pct: string;
  is_active: boolean;
}

export interface StakingPositionRecord {
  id: string;
  wallet_id: string;
  asset_id: string;
  validator_id: string | null;
  amount: string;
  apy_pct: string;
  status: StakingStatus;
  started_at: string;
  unlock_at: string | null;
}

export interface StakingRewardRecord extends Timestamped {
  id: string;
  staking_position_id: string;
  amount: string;
  usd_value: string | null;
  claimed: boolean;
  claimed_at: string | null;
}

export interface ContactRecord extends Timestamped {
  id: string;
  user_id: string;
  name: string;
  note: string | null;
}

export interface BeneficiaryRecord {
  id: string;
  contact_id: string;
  chain: ChainName;
  address: string;
  label: string | null;
}

export interface NotificationRecord extends Timestamped {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  read: boolean;
}

export interface TreasuryPoolRecord {
  id: string;
  asset_id: string;
  amount: string;
  usd_value: string;
  updated_at: string;
}

export interface RoleRecord {
  id: string;
  key: AdminRoleKey;
  name: string;
}

export interface PermissionRecord {
  id: string;
  key: string;
  description: string | null;
}

export interface AdminUserRecord extends Timestamped {
  id: string;
  auth_user_id: string | null;
  email: string;
  role_id: string;
  totp_enabled: boolean;
  is_active: boolean;
}

export interface FraudCaseRecord extends Timestamped {
  id: string;
  user_id: string | null;
  reason: string;
  amount_usd: string | null;
  severity: FraudSeverity;
  status: FraudStatus;
  resolved_at: string | null;
}

export interface AuditLogRecord extends Timestamped {
  id: string;
  actor_admin_id: string | null;
  actor_user_id: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SystemLogRecord extends Timestamped {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
}

export interface KycRequestRecord {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_admin_id: string | null;
}

export interface KycDocumentRecord {
  id: string;
  kyc_request_id: string;
  doc_type: "passport" | "national_id" | "drivers_license" | "proof_of_address" | "selfie";
  storage_path: string;
  uploaded_at: string;
}

export interface AnalyticsEventRecord extends Timestamped {
  id: string;
  user_id: string | null;
  event_name: string;
  properties: Record<string, unknown> | null;
}

export interface SettingRecord {
  key: string;
  value: unknown;
  updated_at: string;
}

/* ------------------- Phase 9: double-entry ledger ------------------- */

export type LedgerAccountType = "user" | "system";
export type LedgerDirection = "debit" | "credit";

export interface LedgerAccountRecord {
  id: string;
  wallet_account_id: string | null;
  asset_id: string;
  account_type: LedgerAccountType;
  system_key: string | null;
  created_at: string;
}

export interface LedgerEntryRecord {
  id: string;
  transaction_id: string;
  ledger_account_id: string;
  direction: LedgerDirection;
  amount: string;
  created_at: string;
}

export interface LedgerEntryInput {
  ledger_account_id: string;
  direction: LedgerDirection;
  amount: number;
}

/* ------------------- Phase 9: currencies ------------------- */

export interface CurrencyRecord {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
}

export interface ExchangeRateRecord {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: string;
  source: string;
  fetched_at: string;
}
