-- =====================================================================
-- Royal Chain Wallet — Core Schema (Phase 8A, pre-integration)
--
-- This migration is NOT applied to any live database in this phase.
-- It exists so the schema is fully designed and reviewable before any
-- Supabase connection is made in a later phase (8B+). Written as
-- idempotent-friendly Postgres/Supabase SQL (uuid pk, RLS-ready).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Users & Auth
-- ---------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid, -- references auth.users(id) once Supabase Auth is connected
  email text unique,
  phone text unique,
  display_name text,
  preferred_currency text not null default 'USD',
  preferred_locale text not null default 'en',
  kyc_status text not null default 'none' check (kyc_status in ('none', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_name text,
  platform text, -- 'ios' | 'android' | 'web'
  fingerprint text, -- opaque device fingerprint, never a raw identifier
  push_token text,
  is_trusted boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  ip_address inet,
  location text,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- ---------------------------------------------------------------------
-- Wallets
-- ---------------------------------------------------------------------

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null default 'Main Wallet',
  is_primary boolean not null default true,
  -- The mnemonic itself is NEVER stored server-side. This table only
  -- tracks wallet metadata; encrypted key material stays on-device.
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain text not null check (chain in ('bitcoin', 'ethereum', 'bnb', 'solana')),
  address text not null,
  derivation_path text not null,
  created_at timestamptz not null default now(),
  unique (wallet_id, chain)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  chain text not null check (chain in ('bitcoin', 'ethereum', 'bnb', 'solana')),
  standard text not null check (standard in ('native', 'spl', 'erc20', 'bep20')),
  decimals int not null,
  contract_address text, -- null for native assets; mint/contract address once supplied
  icon_gradient text,
  is_active boolean not null default true
);

create table if not exists public.balances (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  amount numeric(38, 18) not null default 0,
  usd_value numeric(18, 2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (wallet_account_id, asset_id)
);

-- ---------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  chain text not null check (chain in ('bitcoin', 'ethereum', 'bnb', 'solana')),
  direction text not null check (direction in ('in', 'out')),
  kind text not null default 'transfer' check (kind in ('transfer', 'swap', 'stake', 'unstake', 'reward', 'fee')),
  amount numeric(38, 18) not null,
  usd_value numeric(18, 2),
  fee_usd numeric(18, 2),
  counterparty_address text,
  tx_hash text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  memo text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists idx_transactions_wallet on public.transactions(wallet_id, created_at desc);
create index if not exists idx_transactions_hash on public.transactions(tx_hash);

create table if not exists public.swap_history (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  from_asset_id uuid not null references public.assets(id),
  to_asset_id uuid not null references public.assets(id),
  from_amount numeric(38, 18) not null,
  to_amount numeric(38, 18) not null,
  rate numeric(38, 18) not null,
  slippage_pct numeric(5, 2) not null,
  network_fee_usd numeric(18, 2),
  tx_hash text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Staking
-- ---------------------------------------------------------------------

create table if not exists public.validators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chain text not null default 'solana',
  apy_pct numeric(6, 3) not null,
  commission_pct numeric(5, 2) not null,
  uptime_pct numeric(5, 2) not null,
  is_active boolean not null default true
);

create table if not exists public.staking_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  validator_id uuid references public.validators(id),
  amount numeric(38, 18) not null,
  apy_pct numeric(6, 3) not null,
  status text not null default 'active' check (status in ('active', 'unstaking', 'withdrawn')),
  started_at timestamptz not null default now(),
  unlock_at timestamptz
);

create table if not exists public.staking_rewards (
  id uuid primary key default gen_random_uuid(),
  staking_position_id uuid not null references public.staking_positions(id) on delete cascade,
  amount numeric(38, 18) not null,
  usd_value numeric(18, 2),
  claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Contacts / Beneficiaries
-- ---------------------------------------------------------------------

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  chain text not null check (chain in ('bitcoin', 'ethereum', 'bnb', 'solana')),
  address text not null,
  label text
);

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('transaction', 'price', 'security', 'system')),
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Treasury (platform-level, not per-user)
-- ---------------------------------------------------------------------

create table if not exists public.treasury_pools (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id),
  amount numeric(38, 18) not null default 0,
  usd_value numeric(18, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Admin / RBAC
-- ---------------------------------------------------------------------

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('super_admin', 'finance', 'compliance', 'technical')),
  name text not null
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- e.g. 'treasury.withdraw', 'users.flag'
  description text
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid, -- references auth.users(id) once Supabase Auth is connected
  email text not null unique,
  role_id uuid not null references public.roles(id),
  totp_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fraud / Security / Audit
-- ---------------------------------------------------------------------

create table if not exists public.fraud_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  reason text not null,
  amount_usd numeric(18, 2),
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  target text, -- e.g. 'users.usr_1009', 'treasury.withdraw'
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  source text not null, -- e.g. service name
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- KYC
-- ---------------------------------------------------------------------

create table if not exists public.kyc_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_admin_id uuid references public.admin_users(id)
);

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  kyc_request_id uuid not null references public.kyc_requests(id) on delete cascade,
  doc_type text not null check (doc_type in ('passport', 'national_id', 'drivers_license', 'proof_of_address', 'selfie')),
  storage_path text not null, -- Supabase Storage object path, once Storage is connected
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Analytics / Settings
-- ---------------------------------------------------------------------

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  properties jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security (enabled now, policies added once Auth is wired)
-- ---------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.swap_history enable row level security;
alter table public.staking_positions enable row level security;
alter table public.staking_rewards enable row level security;
alter table public.contacts enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.notifications enable row level security;
alter table public.devices enable row level security;
alter table public.sessions enable row level security;
alter table public.kyc_requests enable row level security;
alter table public.kyc_documents enable row level security;

-- NOTE: no policies are defined yet — with RLS enabled and zero policies,
-- these tables deny all access by default until Supabase Auth is
-- connected in a later phase and per-user policies are added
-- (e.g. `using (auth.uid() = auth_user_id)`), which is the safe default.
