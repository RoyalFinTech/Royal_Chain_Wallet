/**
 * Hand-authored Supabase `Database` type for the Module 2 schema
 * (supabase/migrations/00000000000001_royal_chain_core_schema.sql).
 *
 * This is exactly what `supabase gen types typescript --project-id ...`
 * would produce once that migration is applied to the live project. It's
 * hand-written now (rather than generated) because generating it
 * requires a live connection to royal_chain_db, which this environment
 * cannot reach. Once migrations are applied, run:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/db/database.types.ts
 *
 * ...to replace this file with a verified-live version. Until then, this
 * file is the single source of truth that makes `supabase.from("wallets")`
 * etc. typecheck correctly against src/lib/db/typed-client.ts.
 */
import type {
  ChainName,
  KycStatus,
  TxDirection,
  TxKind,
  TxStatus,
  StakingStatus,
  FraudSeverity,
  FraudStatus,
  AdminRoleKey,
  NotificationKind,
  LogLevel,
  TokenStandard,
} from "./models";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Generic helper: every table gets Row/Insert/Update following Supabase's convention. */
interface TableDef<
  Row,
  InsertOmit extends keyof Row = never,
  UpdateOptional extends keyof Row = keyof Row,
> {
  Row: Row;
  Insert: Omit<Row, InsertOmit> & Partial<Pick<Row, InsertOmit>>;
  Update: Partial<Pick<Row, UpdateOptional>>;
  Relationships: [];
}

export interface Database {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      users: TableDef<
        {
          id: string;
          auth_user_id: string | null;
          email: string | null;
          phone: string | null;
          display_name: string | null;
          preferred_currency: string;
          preferred_locale: string;
          kyc_status: KycStatus;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "created_at"
        | "updated_at"
        | "preferred_currency"
        | "preferred_locale"
        | "kyc_status"
        | "phone"
        | "display_name"
        | "auth_user_id"
        | "email"
      >;

      devices: TableDef<
        {
          id: string;
          user_id: string;
          device_name: string | null;
          platform: string | null;
          fingerprint: string | null;
          push_token: string | null;
          is_trusted: boolean;
          last_seen_at: string | null;
          created_at: string;
        },
        "id" | "created_at" | "is_trusted"
      >;

      sessions: TableDef<
        {
          id: string;
          user_id: string;
          device_id: string | null;
          ip_address: string | null;
          location: string | null;
          started_at: string;
          last_activity_at: string;
          expires_at: string;
          revoked_at: string | null;
        },
        "id" | "started_at" | "last_activity_at"
      >;

      wallets: TableDef<
        {
          id: string;
          user_id: string;
          label: string;
          is_primary: boolean;
          created_at: string;
        },
        "id" | "created_at" | "label" | "is_primary"
      >;

      wallet_accounts: TableDef<
        {
          id: string;
          wallet_id: string;
          chain: ChainName;
          address: string;
          derivation_path: string;
          created_at: string;
        },
        "id" | "created_at"
      >;

      assets: TableDef<
        {
          id: string;
          symbol: string;
          name: string;
          chain: ChainName;
          standard: TokenStandard;
          decimals: number;
          contract_address: string | null;
          icon_gradient: string | null;
          is_active: boolean;
        },
        "id",
        "is_active" | "contract_address" | "icon_gradient"
      >;

      balances: TableDef<
        {
          id: string;
          wallet_account_id: string;
          asset_id: string;
          amount: string;
          usd_value: string;
          updated_at: string;
        },
        "id" | "updated_at" | "amount" | "usd_value"
      >;

      transactions: TableDef<
        {
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
          created_at: string;
          confirmed_at: string | null;
        },
        | "id"
        | "created_at"
        | "kind"
        | "status"
        | "usd_value"
        | "fee_usd"
        | "counterparty_address"
        | "tx_hash"
        | "memo"
        | "confirmed_at"
      >;

      swap_history: TableDef<
        {
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
          created_at: string;
        },
        "id" | "created_at" | "status"
      >;

      validators: TableDef<
        {
          id: string;
          name: string;
          chain: string;
          apy_pct: string;
          commission_pct: string;
          uptime_pct: string;
          is_active: boolean;
        },
        "id",
        "is_active"
      >;

      staking_positions: TableDef<
        {
          id: string;
          wallet_id: string;
          asset_id: string;
          validator_id: string | null;
          amount: string;
          apy_pct: string;
          status: StakingStatus;
          started_at: string;
          unlock_at: string | null;
        },
        "id" | "started_at" | "status"
      >;

      staking_rewards: TableDef<
        {
          id: string;
          staking_position_id: string;
          amount: string;
          usd_value: string | null;
          claimed: boolean;
          claimed_at: string | null;
          created_at: string;
        },
        "id" | "created_at" | "claimed"
      >;

      contacts: TableDef<
        {
          id: string;
          user_id: string;
          name: string;
          note: string | null;
          created_at: string;
        },
        "id" | "created_at"
      >;

      beneficiaries: TableDef<
        {
          id: string;
          contact_id: string;
          chain: ChainName;
          address: string;
          label: string | null;
        },
        "id"
      >;

      notifications: TableDef<
        {
          id: string;
          user_id: string;
          kind: NotificationKind;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        },
        "id" | "created_at" | "read"
      >;

      treasury_pools: TableDef<
        {
          id: string;
          asset_id: string;
          amount: string;
          usd_value: string;
          updated_at: string;
        },
        "id" | "updated_at" | "amount" | "usd_value"
      >;

      roles: TableDef<{ id: string; key: AdminRoleKey; name: string }, "id">;

      permissions: TableDef<{ id: string; key: string; description: string | null }, "id">;

      role_permissions: TableDef<{ role_id: string; permission_id: string }>;

      admin_users: TableDef<
        {
          id: string;
          auth_user_id: string | null;
          email: string;
          role_id: string;
          totp_enabled: boolean;
          is_active: boolean;
          created_at: string;
        },
        "id" | "created_at" | "totp_enabled" | "is_active"
      >;

      fraud_cases: TableDef<
        {
          id: string;
          user_id: string | null;
          reason: string;
          amount_usd: string | null;
          severity: FraudSeverity;
          status: FraudStatus;
          created_at: string;
          resolved_at: string | null;
        },
        "id" | "created_at" | "status" | "resolved_at" | "user_id" | "amount_usd"
      >;

      audit_logs: TableDef<
        {
          id: string;
          actor_admin_id: string | null;
          actor_user_id: string | null;
          action: string;
          target: string | null;
          metadata: Json | null;
          created_at: string;
        },
        "id" | "created_at" | "actor_admin_id" | "actor_user_id" | "target" | "metadata"
      >;

      system_logs: TableDef<
        {
          id: string;
          level: LogLevel;
          source: string;
          message: string;
          metadata: Json | null;
          created_at: string;
        },
        "id" | "created_at"
      >;

      kyc_requests: TableDef<
        {
          id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected";
          submitted_at: string;
          reviewed_at: string | null;
          reviewer_admin_id: string | null;
        },
        "id" | "submitted_at" | "status"
      >;

      kyc_documents: TableDef<
        {
          id: string;
          kyc_request_id: string;
          doc_type: "passport" | "national_id" | "drivers_license" | "proof_of_address" | "selfie";
          storage_path: string;
          uploaded_at: string;
        },
        "id" | "uploaded_at"
      >;

      analytics_events: TableDef<
        {
          id: string;
          user_id: string | null;
          event_name: string;
          properties: Json | null;
          created_at: string;
        },
        "id" | "created_at"
      >;

      settings: TableDef<{ key: string; value: Json; updated_at: string }, never, "value">;

      ledger_accounts: TableDef<
        {
          id: string;
          wallet_account_id: string | null;
          asset_id: string;
          account_type: "user" | "system";
          system_key: string | null;
          created_at: string;
        },
        "id" | "created_at" | "wallet_account_id" | "system_key" | "account_type"
      >;

      ledger_entries: TableDef<
        {
          id: string;
          transaction_id: string;
          ledger_account_id: string;
          direction: "debit" | "credit";
          amount: string;
          created_at: string;
        },
        "id" | "created_at"
      >;

      currencies: TableDef<
        {
          code: string;
          name: string;
          symbol: string;
          decimals: number;
          is_active: boolean;
        },
        never,
        "is_active" | "decimals"
      >;

      exchange_rates: TableDef<
        {
          id: string;
          base_currency: string;
          quote_currency: string;
          rate: string;
          source: string;
          fetched_at: string;
        },
        "id" | "fetched_at" | "base_currency" | "source"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      check_rate_limit: {
        Args: { p_bucket_key: string; p_max_requests: number; p_window_seconds: number };
        Returns: boolean;
      };
      cleanup_rate_limit_events: {
        Args: { older_than_minutes?: number };
        Returns: undefined;
      };
      post_ledger_entries: {
        Args: { p_transaction_id: string; p_entries: Json };
        Returns: undefined;
      };
      record_transaction_with_ledger: {
        Args: {
          p_wallet_id: string;
          p_asset_id: string;
          p_chain: string;
          p_direction: string;
          p_kind: string;
          p_amount: number;
          p_status: string;
          p_entries: Json;
          p_usd_value?: number | null;
          p_fee_usd?: number | null;
          p_counterparty_address?: string | null;
          p_tx_hash?: string | null;
          p_memo?: string | null;
        };
        Returns: Database["public"]["Tables"]["transactions"]["Row"];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
