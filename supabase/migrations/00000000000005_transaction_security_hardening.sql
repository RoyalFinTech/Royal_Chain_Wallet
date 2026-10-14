-- Transaction security hardening. Not applied to a live database.
-- Prerequisite: current server code assumes wallets.user_id equals auth.uid(),
-- but the core schema references public.users(id). Verify provisioning aligns
-- those IDs, or implement an explicit users.auth_user_id mapping before deploy.

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists wallets_insert_own on public.wallets;
create policy wallets_insert_own on public.wallets for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own on public.wallet_accounts for select to authenticated
  using (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = (select auth.uid())));
drop policy if exists wallet_accounts_insert_own on public.wallet_accounts;
create policy wallet_accounts_insert_own on public.wallet_accounts for insert to authenticated
  with check (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = (select auth.uid())));

drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions for select to authenticated
  using (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = (select auth.uid())));

create or replace function public.record_transaction_with_ledger(
  p_wallet_id uuid, p_asset_id uuid, p_chain text, p_direction text,
  p_kind text, p_amount numeric, p_status text, p_entries jsonb,
  p_usd_value numeric default null, p_fee_usd numeric default null,
  p_counterparty_address text default null, p_tx_hash text default null,
  p_memo text default null
) returns public.transactions
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_tx public.transactions;
  e jsonb;
  v_account_type text;
  v_account_asset uuid;
  v_system_key text;
  v_account_wallet uuid;
  v_user_count integer := 0;
  v_system_count integer := 0;
  v_debits numeric := 0;
  v_credits numeric := 0;
  v_direction text;
  v_amount numeric;
  v_account_id uuid;
  v_user_direction text;
  v_system_direction text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_wallet_id is null or not exists (
    select 1 from public.wallets w where w.id = p_wallet_id and w.user_id = auth.uid()
  ) then
    raise exception using errcode = '42501', message = 'Wallet not owned by authenticated user';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Transaction amount must be positive';
  end if;
  if p_direction not in ('in', 'out') or p_kind not in
    ('transfer','deposit','withdrawal','merchant_payment','refund','reversal') then
    raise exception using errcode = '22023', message = 'Invalid transaction direction or kind';
  end if;
  if p_status is distinct from 'pending' then
    raise exception using errcode = '42501', message = 'New client transactions must be pending';
  end if;
  if p_usd_value is not null and p_usd_value < 0 then
    raise exception using errcode = '22023', message = 'USD value cannot be negative';
  end if;
  if p_fee_usd is not null and p_fee_usd <> 0 then
    raise exception using errcode = '22023', message = 'Fee posting requires a separate ledger flow';
  end if;
  if not exists (select 1 from public.assets a where a.id=p_asset_id and a.chain=p_chain and a.is_active) then
    raise exception using errcode = '22023', message = 'Asset inactive or chain mismatch';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) is distinct from 'array' or jsonb_array_length(p_entries) <> 2 then
    raise exception using errcode = '22023', message = 'Exactly two ledger entries are required';
  end if;

  v_user_direction := case when p_direction='out' then 'debit' else 'credit' end;
  v_system_direction := case when p_direction='out' then 'credit' else 'debit' end;

  for e in select value from jsonb_array_elements(p_entries) as x(value) loop
    if jsonb_typeof(e) is distinct from 'object'
       or e->>'ledger_account_id' is null or e->>'amount' is null or e->>'direction' is null then
      raise exception using errcode = '22023', message = 'Malformed ledger entry';
    end if;
    v_account_id := (e->>'ledger_account_id')::uuid;
    v_direction := e->>'direction';
    v_amount := (e->>'amount')::numeric;
    if v_direction not in ('debit','credit') or v_amount is null or v_amount <= 0 then
      raise exception using errcode = '22023', message = 'Invalid ledger entry direction or amount';
    end if;
    if v_amount <> p_amount then
      raise exception using errcode = '22023', message = 'Each ledger entry must equal transaction amount';
    end if;

    select la.account_type, la.asset_id, la.system_key, wa.wallet_id
      into v_account_type, v_account_asset, v_system_key, v_account_wallet
    from public.ledger_accounts la
    left join public.wallet_accounts wa on wa.id=la.wallet_account_id
    where la.id=v_account_id;
    if not found then
      raise exception using errcode = '42501', message = 'Ledger account not found';
    end if;
    if v_account_asset is distinct from p_asset_id then
      raise exception using errcode = '22023', message = 'Ledger account asset mismatch';
    end if;

    if v_account_type='user' then
      if v_account_wallet is distinct from p_wallet_id then
        raise exception using errcode = '42501', message = 'Ledger account belongs to another wallet';
      end if;
      v_user_count := v_user_count+1;
      if v_direction is distinct from v_user_direction then
        raise exception using errcode = '22023', message = 'User ledger direction mismatch';
      end if;
    elsif v_account_type='system' then
      if v_system_key is distinct from 'external_unmatched' then
        raise exception using errcode = '42501', message = 'Unsupported system ledger account';
      end if;
      v_system_count := v_system_count+1;
      if v_direction is distinct from v_system_direction then
        raise exception using errcode = '22023', message = 'Counterparty ledger direction mismatch';
      end if;
    else
      raise exception using errcode = '22023', message = 'Unsupported ledger account type';
    end if;
    if v_direction='debit' then v_debits := v_debits+v_amount;
    else v_credits := v_credits+v_amount; end if;
  end loop;

  if v_user_count<>1 or v_system_count<>1 or v_debits<>p_amount or v_credits<>p_amount then
    raise exception using errcode = '22023', message = 'Ledger entries must balance against the transaction amount';
  end if;

  insert into public.transactions(wallet_id,asset_id,chain,direction,kind,amount,status,usd_value,fee_usd,counterparty_address,tx_hash,memo,confirmed_at)
  values(p_wallet_id,p_asset_id,p_chain,p_direction,p_kind,p_amount,'pending',p_usd_value,null,p_counterparty_address,p_tx_hash,p_memo,null)
  returning * into v_tx;
  perform public.post_ledger_entries(v_tx.id,p_entries);
  return v_tx;
end;
$$;

revoke all on function public.post_ledger_entries(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.record_transaction_with_ledger(uuid,uuid,text,text,text,numeric,text,jsonb,numeric,numeric,text,text,text) from public, anon;
grant execute on function public.record_transaction_with_ledger(uuid,uuid,text,text,text,numeric,text,jsonb,numeric,numeric,text,text,text) to authenticated;

create or replace function public.check_rate_limit(p_bucket_key text,p_max_requests int,p_window_seconds int)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_count bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_bucket_key is distinct from ('tx:record:' || v_user_id::text) then
    raise exception using errcode = '42501', message = 'Rate-limit bucket not authorized';
  end if;
  if p_max_requests is distinct from 20 or p_window_seconds is distinct from 60 then
    raise exception using errcode = '22023', message = 'Unsupported rate-limit configuration';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_bucket_key,0));
  select count(*) into v_count from public.rate_limit_events
    where bucket_key=p_bucket_key and created_at > now()-make_interval(secs=>p_window_seconds);
  insert into public.rate_limit_events(bucket_key) values(p_bucket_key);
  return v_count < p_max_requests;
end;
$$;
revoke all on function public.check_rate_limit(text,integer,integer) from public, anon;
grant execute on function public.check_rate_limit(text,integer,integer) to authenticated;
