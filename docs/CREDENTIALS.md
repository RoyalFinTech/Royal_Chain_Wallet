# Credentials You'll Need to Supply

Everything in this codebase runs on mock/simulated data by default and
never crashes on a missing credential — each item below independently
"turns on" real behavior for its area once supplied. This list is in
priority order: top items unlock the most functionality.

## 1. Supabase Service Role Key — unlocks: admin portal, MCP admin tools

- **Where:** Supabase Dashboard → your project → Project Settings → API
  → `service_role` `secret` key.
- **Env var:** `SUPABASE_SERVICE_ROLE_KEY` (server-only, no `VITE_` prefix)
- **Risk if leaked:** full database read/write bypassing RLS. Never
  commit it, never put it in a `VITE_`-prefixed var, never send it to
  the client.

## 2. Database migrations applied — unlocks: everything that touches Supabase tables

Not a credential exactly, but the #1 blocking item across every phase's
readiness report. See `docs/DEPLOYMENT.md` Step 1. Nothing that queries
`users`, `wallets`, `transactions`, `ledger_entries`, etc. will work
until you run:
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## 3. Blockchain RPC endpoints — unlocks: real balances, real broadcasting, per chain

Each is independent — supply the ones you need, skip the rest.

| Chain | Env var | Where to get one |
|---|---|---|
| Solana | `VITE_SOL_RPC_URL` | Helius, QuickNode, Alchemy, Triton (free tiers exist; public endpoints are rate-limited, not recommended for production) |
| Ethereum | `VITE_ETH_RPC_URL` | Alchemy, Infura, QuickNode |
| BNB Smart Chain | `VITE_BNB_RPC_URL` | Ankr, QuickNode, or BNB Chain's public RPC |
| Polygon | `VITE_POLYGON_RPC_URL` | Alchemy, Infura, QuickNode |
| Base | `VITE_BASE_RPC_URL` | Alchemy, Coinbase's public Base RPC |
| Bitcoin | `VITE_BTC_API_URL` | `https://blockstream.info/api` (public, rate-limited) or self-hosted Esplora/electrs for production |

**Before mainnet:** point these at testnet/devnet equivalents first and
verify actual broadcast + confirmation works (see
`docs/PRODUCTION_READINESS.md` — this has never been tested against a
live network from this environment).

## 4. WalletConnect / Reown Project ID — unlocks: "Connect via WalletConnect"

- **Where:** https://cloud.reown.com — free account, create a project,
  copy the Project ID.
- **Env var:** `VITE_WALLETCONNECT_PROJECT_ID`
- **Note:** this is a public identifier, not a secret — safe in a
  `VITE_`-prefixed var.

## 5. Token contract/mint addresses — unlocks: real ROY/USDT/USDC balances

| Token | Env var | Notes |
|---|---|---|
| ROY (your own token) | `VITE_ROY_MINT` | Your Solana SPL mint address once ROY is deployed |
| USDT | `VITE_USDT_MINT` | Mainnet: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| USDC | `VITE_USDC_MINT` | Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

Note: SPL token transfers aren't wired to real signing yet regardless
(see `docs/REMAINING_WORK.md`) — these addresses currently only affect
balance *display*, not sends.

## 6. Pricing provider — unlocks: real exchange rates instead of static mock rates

- **Env vars:** `VITE_PRICE_PROVIDER_URL`, `VITE_PRICE_PROVIDER_API_KEY`
- **Where:** any market data API (CoinGecko, CoinMarketCap, etc.) —
  `getPricingService()` in `lib/config/currency-preference.ts` has the
  integration seam; the actual HTTP call to your chosen provider isn't
  implemented yet (throws until you both supply these AND implement the
  `LivePricingService` class body).

## 7. Firebase — unlocks: push notifications (not wired to any UI yet)

- **Env vars:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- Lowest priority — `NotificationService.registerPushToken` has no real
  implementation regardless of these being set.

## 8. MCP server credentials — separate `.env`, in `mcp-server/`

Own copy of `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` — see `mcp-server/.env.example`. Deliberately
not shared with the main app's `.env` since the MCP server is a
separate deployable process.

## What I could NOT prepare for you

- **Storage buckets and policies** — Supabase Storage was never
  configured in this codebase (no bucket names, no upload code exists
  yet beyond the `kyc_documents.storage_path` column expecting one to
  exist eventually). If you need file uploads (KYC documents, etc.),
  that's new work, not a credential to supply.
- **Any live testing** — every item above enables real behavior once
  supplied, but I have no network path to test any of it from this
  environment. See `docs/PRODUCTION_READINESS.md` for the full
  verified/not-verified breakdown.
