# Royal Chain Wallet — Deployment Guide

## Prerequisites you need to provide (none of these were available to Claude)

1. **Database access** to `royal_chain_db` — either the Supabase
   dashboard's SQL editor, or `supabase db push` with a linked project +
   DB password.
2. **`SUPABASE_SERVICE_ROLE_KEY`** — from Supabase project settings
   (Settings → API). Server-only, never expose to the browser.
3. **Blockchain RPC endpoints** — at minimum a Solana RPC URL to go live
   on the primary chain. Options: a paid provider (Helius, QuickNode,
   Alchemy) or a self-hosted node. Public free endpoints exist but are
   rate-limited and not recommended for production.
4. **Bitcoin API** — an Esplora-compatible endpoint (blockstream.info's
   public API works for low volume; self-host `electrs`/`esplora` for
   production).

## Step 1 — Apply database migrations

```bash
# From the project root, with the Supabase CLI linked to your project:
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# Or, paste the contents of both files (in order) into the Supabase
# dashboard's SQL editor:
#   supabase/migrations/00000000000001_royal_chain_core_schema.sql
#   supabase/migrations/00000000000002_rate_limiting.sql
```

Verify:
```sql
select count(*) from information_schema.tables where table_schema = 'public';
-- expect 28 (27 from migration 1 + rate_limit_events from migration 2)

select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relrowsecurity = true;
-- expect 16 rows, all RLS-enabled tables
```

Both migrations were dry-run verified against a local disposable Postgres
16 instance during Phase 8B (see `docs/PRODUCTION_READINESS.md`) — they
apply cleanly, but that is not the same as having been applied to your
actual `royal_chain_db`. Do this step before anything else.

## Step 2 — Add RLS policies

The migration deliberately ships with RLS **enabled but zero policies**
(deny-all). Before going live, add policies like:

```sql
create policy "Users can read their own profile"
  on public.users for select
  using (auth.uid() = auth_user_id);

create policy "Users can read their own wallets"
  on public.wallets for select
  using (auth.uid() = (select auth_user_id from public.users where id = wallets.user_id));

-- Repeat the pattern for wallet_accounts, balances, transactions,
-- swap_history, staking_positions, staking_rewards, contacts,
-- beneficiaries, notifications, devices, sessions, kyc_requests,
-- kyc_documents — joining back to users.auth_user_id = auth.uid()
-- through the relevant foreign key chain.
```

This is real security work, not boilerplate — get it reviewed.

## Step 3 — Regenerate real Supabase types

`src/lib/db/database.types.ts` is hand-authored to match the migration
exactly. Once applied, regenerate it for real and diff against the
hand-authored version to catch any drift:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/lib/db/database.types.ts
```

## Step 4 — Configure environment variables

See `docs/ENVIRONMENT_CHECKLIST.md` for the full list. At minimum for a
functional deploy: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
(already set), `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SOL_RPC_URL`.

## Step 5 — Enable Supabase Auth settings

In the Supabase dashboard → Authentication → Providers/Settings:
- Enable "Confirm email" if you want email verification (Priority 2's
  `signUp` flow assumes this is configured there, not in application code).
- Set the site URL / redirect URLs to match your deployed domain (used by
  `requestPasswordReset`'s `redirectTo`).

## Step 6 — Deploy the web app

This is a TanStack Start app targeting Cloudflare Workers:

```bash
npm install
npm run build
npx wrangler deploy   # or your existing Cloudflare Pages/Workers pipeline
```

`npm run build` was verified in this phase to produce a working client +
SSR + Workers bundle with all Phase 8B additions.

## Step 7 — Deploy the MCP server (optional)

Separate Node process, not part of the Cloudflare Workers bundle:

```bash
cd mcp-server
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run build
npm start
```

Deploy anywhere that runs a long-lived Node process with stdio access
from your MCP client (this is not an HTTP server).

## Step 8 — Smoke test before opening to real users

- [ ] Sign up a test account, confirm the email verification flow works
- [ ] Create a wallet, confirm addresses are generated correctly
- [ ] Send a small real transaction on one chain, confirm it's recorded
- [ ] Check `database_status` via the MCP server (or a manual query)
      confirms the migration is live
- [ ] Confirm RLS policies actually restrict cross-user access (try
      querying another user's wallet with your own session token — it
      should return nothing)
