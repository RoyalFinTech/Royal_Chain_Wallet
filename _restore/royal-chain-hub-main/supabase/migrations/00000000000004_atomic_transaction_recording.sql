-- =====================================================================
-- Royal Chain Wallet — Atomic transaction + ledger recording (Phase 9)
--
-- PostgREST (what supabase-js talks to) doesn't expose multi-statement
-- client transactions — each .from(...) call is its own implicit
-- transaction. Inserting a `transactions` row and then separately
-- calling post_ledger_entries as two round-trips would leave a window
-- where a transaction row exists with no ledger entries (or vice versa)
-- if the second call fails. This function does both inside ONE Postgres
-- function invocation, which Postgres itself runs as a single atomic
-- transaction — either everything commits, or nothing does.
--
-- Verified against a local disposable Postgres 16 instance (see
-- docs/PRODUCTION_READINESS.md) — not applied to any live database.
-- =====================================================================

create or replace function public.record_transaction_with_ledger(
  p_wallet_id uuid,
  p_asset_id uuid,
  p_chain text,
  p_direction text,
  p_kind text,
  p_amount numeric,
  p_status text,
  p_entries jsonb,
  p_usd_value numeric default null,
  p_fee_usd numeric default null,
  p_counterparty_address text default null,
  p_tx_hash text default null,
  p_memo text default null
)
returns public.transactions
language plpgsql
as $$
declare
  v_tx public.transactions;
begin
  insert into public.transactions (
    wallet_id, asset_id, chain, direction, kind, amount, status,
    usd_value, fee_usd, counterparty_address, tx_hash, memo,
    confirmed_at
  ) values (
    p_wallet_id, p_asset_id, p_chain, p_direction, p_kind, p_amount, p_status,
    p_usd_value, p_fee_usd, p_counterparty_address, p_tx_hash, p_memo,
    case when p_status = 'confirmed' then now() else null end
  )
  returning * into v_tx;

  -- Raises and rolls back the whole function (including the insert
  -- above) if entries don't balance — see post_ledger_entries.
  perform public.post_ledger_entries(v_tx.id, p_entries);

  return v_tx;
end;
$$;
