-- =====================================================================
-- Royal Chain Wallet — Double-Entry Ledger + Currencies (Phase 9)
--
-- Extends the existing schema (migrations 1-2) rather than duplicating
-- it. Two real additions:
--
-- 1. A genuine double-entry ledger (ledger_accounts + ledger_entries).
--    `balances` (from migration 1) becomes a maintained CACHE, kept in
--    sync by a trigger — the ledger is now the source of truth, and
--    application code must never UPDATE balances directly (nothing in
--    this codebase does; the trigger is the only writer).
--
-- 2. `currencies` + `exchange_rates` — the real backing for the dynamic
--    multi-currency system already built client-side in
--    lib/currencies.ts / lib/config/currency-preference.ts (which today
--    uses a static in-memory rate table).
--
-- NOTE on scope: `transfers`, `deposits`, `withdrawals`, `merchant
-- payments`, `refunds`, and `reversals` are modeled as `transactions.kind`
-- values (extended below) rather than separate tables. Real transfers/
-- deposits/withdrawals/etc. share every column `transactions` already
-- has (asset, amount, status, chain, ledger linkage) — separate tables
-- would duplicate that schema, which the brief explicitly said not to
-- do. `agents` and `merchants` are NOT included in this migration; see
-- docs/REMAINING_WORK.md for why they were scoped out of this pass.
--
-- Verified against a local disposable Postgres 16 instance (not applied
-- to any live database — same constraint as every prior migration in
-- this project; see docs/PRODUCTION_READINESS.md).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extend transactions.kind to cover the full accounting vocabulary
-- ---------------------------------------------------------------------

alter table public.transactions drop constraint if exists transactions_kind_check;
alter table public.transactions add constraint transactions_kind_check
  check (kind in ('transfer', 'swap', 'stake', 'unstake', 'reward', 'fee',
                   'deposit', 'withdrawal', 'merchant_payment', 'refund', 'reversal'));

-- ---------------------------------------------------------------------
-- Ledger accounts — one per (wallet_account, asset) for real users,
-- plus a small set of system accounts for the other side of entries
-- that don't have a Royal Chain Wallet user on the other end (external
-- blockchain addresses, network fees, etc).
-- ---------------------------------------------------------------------

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid references public.wallet_accounts(id) on delete cascade,
  asset_id uuid not null references public.assets(id),
  account_type text not null default 'user' check (account_type in ('user', 'system')),
  system_key text, -- e.g. 'network_fees', 'external_unmatched' — set only when account_type='system'
  created_at timestamptz not null default now(),
  constraint ledger_accounts_user_or_system check (
    (account_type = 'user' and wallet_account_id is not null and system_key is null) or
    (account_type = 'system' and wallet_account_id is null and system_key is not null)
  ),
  unique (wallet_account_id, asset_id)
);
create unique index if not exists idx_ledger_accounts_system_key on public.ledger_accounts(system_key, asset_id) where account_type = 'system';

-- ---------------------------------------------------------------------
-- Ledger entries — the actual double-entry rows. Every amount is
-- positive; direction carries the sign. A transaction's entries must
-- always balance (enforced in post_ledger_entries below, not just by
-- convention).
-- ---------------------------------------------------------------------

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  ledger_account_id uuid not null references public.ledger_accounts(id),
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric(38, 18) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_ledger_entries_transaction on public.ledger_entries(transaction_id);
create index if not exists idx_ledger_entries_account on public.ledger_entries(ledger_account_id, created_at desc);

-- ---------------------------------------------------------------------
-- post_ledger_entries — the ONLY sanctioned way to write ledger_entries.
-- Verifies debits == credits for the batch before inserting anything;
-- raises (aborting the whole transaction) if unbalanced. Called inside
-- the same DB transaction that inserts/updates the `transactions` row,
-- so a failure here rolls back the transaction record too — no
-- transaction can exist without balanced entries.
-- ---------------------------------------------------------------------

create or replace function public.post_ledger_entries(p_transaction_id uuid, p_entries jsonb)
returns void
language plpgsql
as $$
declare
  v_debit_total numeric(38, 18) := 0;
  v_credit_total numeric(38, 18) := 0;
  v_entry jsonb;
begin
  if jsonb_array_length(p_entries) < 2 then
    raise exception 'A ledger posting needs at least 2 entries (one debit, one credit); got %', jsonb_array_length(p_entries);
  end if;

  for v_entry in select * from jsonb_array_elements(p_entries) loop
    if (v_entry->>'direction') = 'debit' then
      v_debit_total := v_debit_total + (v_entry->>'amount')::numeric;
    elsif (v_entry->>'direction') = 'credit' then
      v_credit_total := v_credit_total + (v_entry->>'amount')::numeric;
    else
      raise exception 'Invalid ledger entry direction: %', v_entry->>'direction';
    end if;
  end loop;

  if v_debit_total <> v_credit_total then
    raise exception 'Unbalanced ledger entries for transaction %: debits=% credits=%', p_transaction_id, v_debit_total, v_credit_total;
  end if;

  insert into public.ledger_entries (transaction_id, ledger_account_id, direction, amount)
  select
    p_transaction_id,
    (e->>'ledger_account_id')::uuid,
    e->>'direction',
    (e->>'amount')::numeric
  from jsonb_array_elements(p_entries) e;
end;
$$;

-- ---------------------------------------------------------------------
-- Keep `balances` (migration 1) as a synced cache of the ledger. This
-- trigger is the ONLY writer to balances.amount from this point on —
-- application code must never UPDATE balances directly.
-- ---------------------------------------------------------------------

create or replace function public.recompute_balance_from_ledger()
returns trigger
language plpgsql
as $$
declare
  v_wallet_account_id uuid;
  v_asset_id uuid;
  v_net numeric(38, 18);
begin
  select wallet_account_id, asset_id into v_wallet_account_id, v_asset_id
  from public.ledger_accounts where id = NEW.ledger_account_id;

  if v_wallet_account_id is null then
    return NEW; -- system account — no user-facing balances row to maintain
  end if;

  select coalesce(sum(case when direction = 'credit' then amount else -amount end), 0)
  into v_net
  from public.ledger_entries
  where ledger_account_id = NEW.ledger_account_id;

  insert into public.balances (wallet_account_id, asset_id, amount, updated_at)
  values (v_wallet_account_id, v_asset_id, v_net, now())
  on conflict (wallet_account_id, asset_id)
  do update set amount = excluded.amount, updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists trg_recompute_balance on public.ledger_entries;
create trigger trg_recompute_balance
  after insert on public.ledger_entries
  for each row execute function public.recompute_balance_from_ledger();

-- ---------------------------------------------------------------------
-- Currencies + exchange rates — real backing for the dynamic
-- multi-currency system (today: static rates in lib/currencies.ts).
-- ---------------------------------------------------------------------

create table if not exists public.currencies (
  code text primary key, -- ISO 4217, e.g. 'USD', 'GMD'
  name text not null,
  symbol text not null,
  decimals int not null default 2,
  is_active boolean not null default true
);

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'USD' references public.currencies(code),
  quote_currency text not null references public.currencies(code),
  rate numeric(20, 8) not null check (rate > 0),
  source text not null default 'manual', -- e.g. 'manual', 'provider:xyz'
  fetched_at timestamptz not null default now(),
  unique (base_currency, quote_currency, fetched_at)
);
create index if not exists idx_exchange_rates_latest on public.exchange_rates(base_currency, quote_currency, fetched_at desc);

alter table public.ledger_accounts enable row level security;
alter table public.ledger_entries enable row level security;
-- No policies yet — same deny-by-default posture as migration 1, for
-- the same reason (policies need real auth.uid()-based rules written
-- and reviewed against the live schema, not guessed at here).
