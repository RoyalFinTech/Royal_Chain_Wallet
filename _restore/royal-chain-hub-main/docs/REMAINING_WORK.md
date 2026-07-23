# Remaining Work (updated — Phase 10)

## Blocking real-money production launch (unchanged from Phase 9)

1. **Apply all 4 migrations to the real `royal_chain_db`.**
2. **Write and review RLS policies** (still zero policies).
3. **Test Solana and Bitcoin signing on devnet/testnet before mainnet.**
4. **Provision `SUPABASE_SERVICE_ROLE_KEY`.**
5. **Get the ledger's chart-of-accounts design reviewed.**

## New this phase

6. **Test WalletConnect against a real dapp** — see
   `docs/WALLETCONNECT.md`'s testing checklist. Specifically verify the
   Solana CAIP-2 chain references and fix `extractTxFromParams` to
   handle the full `eth_sendTransaction` shape and
   `solana_signTransaction`'s serialized-transaction format (currently a
   simplified placeholder that only handles basic native transfers).
7. **Resolve the WalletConnect bundle-size question** — 641KB gzipped
   added to the server bundle; confirm this doesn't exceed your
   Cloudflare Workers plan's script size limit, and investigate proper
   SSR exclusion if it does (my attempt via `vite.config.ts`'s
   `ssr.external` had no effect against Nitro's bundling pass).
8. **Build storage buckets and policies** if KYC document upload or any
   other file storage is needed — this doesn't exist yet at all, not
   even as a code stub.

## Not started / explicitly scoped out (unchanged from Phase 9)

- **SPL token transfer signing** (ROY/USDT/USDC) — native transfers
  (BTC/ETH/BNB/SOL) are wired to real signing; SPL tokens still simulate.
  Requires associated-token-account derivation + Token Program Transfer
  instruction encoding, another hand-rolled Solana binary format —
  scoped out rather than rushed alongside everything else this phase.
- **`agents` and `merchants` tables** — mentioned in the Phase 9 request
  but not built. These are new business concepts (not extensions of
  anything that existed), and modeling them correctly (agent commission
  structures? merchant settlement cycles? KYB vs KYC?) needs actual
  product requirements, not assumptions made to check a box.
- **Wallet switching UI** — `lib/wallet/accounts.ts` (Phase 8A) has the
  registry/switching logic; still no "Add Wallet" / switcher screen.
- **Nonce management beyond ethers.js defaults** — `Wallet.sendTransaction`
  fetches the current nonce automatically, which is correct for
  single-transaction sends but doesn't handle concurrent-transaction
  queuing (e.g. a user submitting a second send before the first
  confirms). Low priority unless/until that's a real usage pattern.
- **Live pricing feed, push notifications, KYC document upload** —
  unchanged from Phase 8B, still not started.
- **On-device biometric enrollment (WebAuthn RP challenge)** — unchanged
  from Phase 8B.
- **i18n string extraction** — unchanged; framework complete, no screen
  calls `t()` yet.
- **Structured server-function errors** — server functions still throw
  plain `Error`, not `AppError` subclasses.

## Lower priority / polish

Unchanged from Phase 8B's list: pull-to-refresh, haptics, portfolio
charts/watchlist, accessibility audit, virtualized lists, image
optimization, tablet/foldable layouts, OpenAPI export, scheduled
`cleanup_rate_limit_events` job.
