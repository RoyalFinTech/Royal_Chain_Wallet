# Environment Variable Checklist

Full reference: `.env.example` (main app), `mcp-server/.env.example` (MCP server).

## Already configured (platform-provisioned)

- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`

## Required before any real (non-mock) functionality works

- [ ] `SUPABASE_SERVICE_ROLE_KEY` — required for admin server functions
      (`src/server/admin*.ts`) and the MCP server's admin tools.
      **Server-only. Never prefix with `VITE_`.**

## Required for live blockchain data (optional — falls back to mock per-chain if unset)

- [ ] `VITE_SOL_RPC_URL` — Solana (primary chain; prioritize this one)
- [ ] `VITE_ETH_RPC_URL` — Ethereum
- [ ] `VITE_BNB_RPC_URL` — BNB Smart Chain
- [ ] `VITE_BTC_API_URL` — Bitcoin (Esplora-compatible REST API, e.g. `https://blockstream.info/api`)
- [ ] `VITE_POLYGON_RPC_URL` — Polygon (shares the Ethereum address)
- [ ] `VITE_BASE_RPC_URL` — Base (shares the Ethereum address)

## Required for token features (optional — placeholders until set)

- [ ] `VITE_ROY_MINT` — Royal Token SPL mint address
- [ ] `VITE_USDT_MINT` — USDT SPL mint address (mainnet: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`)
- [ ] `VITE_USDC_MINT` — USDC SPL mint address (mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)

## Required for a full deployed backend API (optional — server functions bypass this)

- [ ] `VITE_API_BASE_URL` — only needed if you stand up a separate REST
      API rather than using the TanStack Start server functions in `src/server/`

## Required for WalletConnect (Phase 10) — optional, gates the "Connect via WalletConnect" screen

- [ ] `VITE_WALLETCONNECT_PROJECT_ID` — free at https://cloud.reown.com.
      See `docs/WALLETCONNECT.md` for integration status and a
      post-deployment testing checklist.

## Required for live pricing (optional — falls back to static mock rates)

- [ ] `VITE_PRICE_PROVIDER_URL`
- [ ] `VITE_PRICE_PROVIDER_API_KEY`

## Required for push notifications (not started — see REMAINING_WORK.md)

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

## Optional

- [ ] `VITE_FEATURE_FLAGS` — comma-separated overrides, e.g. `live_rpc,live_pricing`
- [ ] `VITE_APP_ENV` — `development` | `staging` | `production`

## MCP server (separate `.env`, own credentials)

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
