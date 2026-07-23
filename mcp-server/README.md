# Royal Chain Wallet MCP Server

Exposes wallet and admin operations as MCP tools over stdio, backed by
Supabase (PostgREST) — **never a direct PostgreSQL connection**, per the
project requirement.

## Tools

| Tool | Access level | What it actually does |
|---|---|---|
| `create_wallet` | Public | Returns a deep link to the app's creation flow. **Does not generate keys.** |
| `import_wallet` | Public | Returns a deep link to the app's import flow. **Never accepts a mnemonic.** |
| `get_balance` | User (RLS) | Real query against `wallet_accounts`/`balances`, scoped to the caller's session token. |
| `get_transactions` | User (RLS) | Real query against `transactions`, scoped to the caller's session token. |
| `send_transaction` | User (RLS) | Returns a deep link pre-filling the app's send flow. **Never signs or broadcasts.** |
| `search_user` | Admin (service role) | Real query against `users`. |
| `admin_dashboard` | Admin (service role) | Real aggregate counts across `users`/`transactions`/`fraud_cases`. |
| `database_status` | Admin (service role) | Real reachability + migration-applied check. |

## Why create_wallet / import_wallet / send_transaction don't do the obvious thing

Royal Chain Wallet is **non-custodial**: private keys are generated and
encrypted on the user's device and never transmitted anywhere (see
`src/lib/wallet/` in the main app). If this MCP server generated a
mnemonic, accepted one as a tool argument, or signed a transaction
server-side, it would silently turn the wallet custodial — a much bigger
problem than a missing feature, and exactly the kind of thing that's easy
to miss when "just implementing the 8 requested tools." These three tools
instead return a deep link / pending-action descriptor for the actual
Royal Chain Wallet app to complete, where the cryptography happens
on-device as designed.

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run build
npm start
```

## Status

- ✅ Protocol handshake, `tools/list`, and `tools/call` dispatch verified
  end-to-end via a local stdio smoke test (see Phase 8B delivery notes).
- ⛔ The Supabase-backed tools (`get_balance`, `get_transactions`,
  `search_user`, `admin_dashboard`, `database_status`) are code-complete
  but **not** tested against a live database — this environment has no
  network path to Supabase. They will work once real credentials are
  supplied and this server is deployed somewhere with network access to
  your Supabase project, but that combination hasn't been exercised yet.
- ⛔ Requires the Module 2 migration to be applied to `royal_chain_db`
  first — `database_status` will report this clearly if not.
