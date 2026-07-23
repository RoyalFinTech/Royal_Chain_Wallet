-- =====================================================================
-- Royal Chain Wallet — Rate Limiting (Phase 8B, Priority 6)
--
-- Fixed-window rate limiting enforced in Postgres so it applies no
-- matter which client calls in (web app, MCP server, future mobile
-- app) — not just whichever layer remembers to check a client-side
-- counter. NOT applied to the live database in this phase (see
-- migration 00000000000001 header for why); verified against a local
-- disposable Postgres instance instead.
-- =====================================================================

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null, -- e.g. 'auth:signin:<email>', 'tx:send:<user_id>'
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_bucket_time on public.rate_limit_events(bucket_key, created_at desc);

-- Auto-expire old events so the table doesn't grow unbounded. Run via a
-- scheduled job (pg_cron once available) or an edge function on a timer;
-- documented here rather than assumed, since pg_cron availability
-- depends on the Supabase plan.
create or replace function public.cleanup_rate_limit_events(older_than_minutes int default 60)
returns void
language sql
as $$
  delete from public.rate_limit_events
  where created_at < now() - make_interval(mins => older_than_minutes);
$$;

-- Returns true if the caller is within limits (and records this attempt);
-- false if the limit is exceeded (attempt is still recorded, so repeated
-- hammering doesn't get a free pass once the window rolls over slightly).
create or replace function public.check_rate_limit(
  p_bucket_key text,
  p_max_requests int,
  p_window_seconds int
)
returns boolean
language plpgsql
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.rate_limit_events
  where bucket_key = p_bucket_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  insert into public.rate_limit_events (bucket_key) values (p_bucket_key);

  return v_count < p_max_requests;
end;
$$;

alter table public.rate_limit_events enable row level security;
-- No policies: only accessible via the SECURITY DEFINER-free functions
-- above, called from server-side code (service role) or RPC — never
-- queried directly by client-side RLS-scoped requests.
