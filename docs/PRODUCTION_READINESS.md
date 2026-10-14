# Production Readiness Report — historic verification plus 2026-10-14 follow-up

> **Current assessment: NOT production-ready.** This document preserves evidence collected in earlier phases; see the dated update below before treating any older status statement as current.

## 2026-10-14 follow-up — current release gate

- A read-only inspection of the active Supabase project reports migration history versions **1–10**, while this repository contains source SQL for migrations 1–4 and proposed migration 11. Recover and reconcile exact SQL for migrations 5–10 against the live schema, privileges, functions, and RLS before applying any database change. **Migration 11 has not been applied.**
- Native transfers now fail closed when the chain RPC is not configured, when the asset has no implemented signing path, or when the wallet is not unlocked. The signer-derived source address is checked against the selected sender, and amount/recipient validation runs before signing.
- Formerly fabricated transaction hashes, “confirmed” statuses, token balances, swap results, staking positions/rewards, NFT holdings, fiat deposits, and admin activity have been removed or gated. The UI shows empty/not-connected states when integrations are absent.
- Receive QR codes now use a real QR encoder and actual local wallet addresses. The shared logo is self-hosted at `/royal-chain-wallet-logo.svg` instead of relying on a deployment-specific Lovable asset URL.
- The client-facing transaction recording endpoint now rejects ledger writes until a trusted server-side chain verifier is configured. Proposed migration 11 restricts the authoritative ledger procedure to `service_role`, requires a verified hash and confirmed status, and includes atomic wallet/account creation. These are source changes only; no live migration was executed.
- WalletConnect has no real dApp/relay test yet; no chain testnet broadcast has been performed. ROY minting and SPL token transfers are not ready.
- Check current-head CI and Render status before treating this branch as build-verified. Older green CI runs predate these changes.

## Historical Phase 9 notes — evidence, not current live status

The original Phase 9 review used a local disposable PostgreSQL instance and unit tests. It did not prove live database permissions, live RLS behavior, or real blockchain broadcasts. Older statements below about live schema, migration history, or RLS are observations from that earlier review and are superseded by the 2026-10-14 update above.

## Correction of a false premise in the Phase 9 request

The Phase 9 request stated the "production Supabase backend, migrations,
authentication, RLS, ledger system, and documentation already exist,"
and referenced tables (`profiles`, `ledger_accounts`, `ledger_entries`,
`transfers`, `deposits`, `withdrawals`, `agents`, `merchants`, `kyc`,
`currencies`, `exchange_rates`) that did not exist anywhere in this
codebase before this phase. None of the migrations from any phase have
been applied to a live database — this was true before Phase 9 and
remains true after it. See `docs/DEPLOYMENT.md` Step 1 for what applying
them actually requires.

## What was actually verified this phase, and how

| Area | Verified? | Method |
|---|---|---|
| Ledger migration applies cleanly (3 migrations, in order) | ✅ Yes | Applied to a local disposable Postgres 16 instance with `ON_ERROR_STOP=1` |
| `post_ledger_entries()` accepts balanced entries and updates `balances` via trigger | ✅ Yes | Real insert + query against local Postgres — credited a user ledger account 2.5, confirmed `balances.amount = 2.5` |
| `post_ledger_entries()` rejects unbalanced entries | ✅ Yes | Attempted a 1.0 debit / 0.9 credit posting — got a real `ERROR: Unbalanced ledger entries`, confirmed zero rows were inserted and `balances` was unchanged |
| `record_transaction_with_ledger()` is genuinely atomic | ✅ Yes | Called it with unbalanced entries — confirmed the `transactions` row was NOT persisted either (count stayed at 0), proving the whole function rolled back, not just the ledger half |
| `record_transaction_with_ledger()` happy path | ✅ Yes | Called with balanced entries — transaction inserted, ledger entries posted, balance updated, all in one call |
| Solana transaction wire format (compact-u16 varint, message layout) | ✅ Yes | 6 unit tests: round-trip varint encoding, exact byte-layout assertions against the documented spec, and — critically — a real `nacl.sign.detached.verify()` check that a produced signature validates against the exact serialized bytes with the signer's real public key (and a negative test confirming a wrong key fails verification) |
| TypeScript compiles | ✅ Yes | Main app + `mcp-server`, both clean |
| Lint | ✅ Yes | 0 errors, same 10 pre-existing warnings as Phase 8B |
| Unit tests | ✅ Yes | 23/23 passing (17 from Phase 8A/B + 6 new Solana wire tests) |
| Production build | ✅ Yes | Client + SSR + Cloudflare Workers bundles all succeed, including bitcoinjs-lib PSBT code and ethers Wallet signing code now in the bundle |
| Real broadcast to Solana/Ethereum/BNB/Bitcoin mainnet or testnet | ⛔ No | No network path from this sandbox to any blockchain RPC endpoint (confirmed via `curl`, same as Phase 8B) |
| EVM transaction signing/nonce handling under real network conditions | ⛔ No | Code uses ethers.js's `Wallet.sendTransaction`, a mature and widely-used implementation, but has not been exercised against a live node |
| Bitcoin UTXO selection + PSBT broadcast under real network conditions | ⛔ No | Same reason — the UTXO-selection logic is new and hand-written (unlike EVM's ethers.js reliance); this is the least-tested piece of new code this phase |
| Live database queries (Supabase) | ⛔ No | Same network/credential restrictions as every prior phase |
| RLS policies restricting cross-user access | ⚠️ Not fully verified | The older review reported zero policies; the later live project history has migrations 1–10 and must be audited table-by-table against missing SQL sources 5–10. Proposed migration 11 is not applied. |

## Specific, honest risk callouts

1. **Solana signing is hand-implemented, not library-backed.** I avoided
   `@solana/web3.js` deliberately (it broke this project's SSR build
   earlier), which means the transaction wire format is my own
   implementation against the public spec, not a battle-tested library.
   The unit tests give real confidence in the cryptographic correctness
   (signatures verify against the exact bytes produced), but **this has
   never been broadcast to an actual Solana cluster.** Test on devnet
   before mainnet use — do not skip this.
2. **Bitcoin UTXO selection is new, hand-written code**, not from a
   library. It's a simple greedy selector; it has not been tested against
   real UTXO sets, real fee-market conditions, or edge cases like dust
   outputs from many small UTXOs.
3. **No auto-retry on broadcast, by design** (see `signing.ts` header
   comment) — retrying a timed-out broadcast for EVM or Bitcoin could
   create a second, independently valid transaction and double-send
   funds, since both re-fetch a fresh nonce/UTXO set on each call. This
   was a deliberate safety trade-off, not an oversight — flagging it so
   it isn't mistaken for "retry logic not implemented yet."
4. **SPL token transfers (ROY/USDT/USDC) are not wired to real signing.**
   Token balances now return an empty/unconfigured state rather than mock
   holdings, and transfers fail closed. Building this correctly requires
   verified mint addresses, associated-token-account logic, SPL Token
   instructions, and on-chain testing. See `docs/REMAINING_WORK.md`.

## Is this production ready?

**No.** The blocking items from Phase 8B's report are unchanged (apply
migrations to the real `royal_chain_db`, write and review RLS policies,
provision `SUPABASE_SERVICE_ROLE_KEY`). Phase 9 adds two more before any
real funds should move:

5. **Test the Solana and Bitcoin signing paths on testnet/devnet** before
   any mainnet transaction. This is the single most important thing
   standing between this codebase and a real financial-loss incident if
   skipped.
6. **Get the ledger design reviewed by someone who owns double-entry
   accounting for this business** — the mechanics (balance, atomicity)
   are verified; the *chart of accounts* design (what system accounts
   exist, how fees/refunds/reversals map to entries) reflects my own
   reasonable-but-unreviewed judgment about how a non-custodial wallet's
   ledger should work, not a specification you gave me.

---

## Phase 10 addendum — Live Deployment & Integration prep

**No live verification was possible or attempted this phase.** The
Phase 10 request asked me to verify RLS with real authenticated users,
broadcast to testnets, verify WalletConnect, verify storage buckets,
verify audit logging/notifications live, and verify ledger consistency
after real blockchain confirmation — I have no credentials and no
network path to Supabase or any blockchain endpoint from this sandbox
(re-confirmed at the start of this phase: same 403s as Phase 8B and 9).
None of these were tested. Every item below is either code preparation
or something genuinely re-verified locally — nothing is "verified live."

| Area | Status |
|---|---|
| `.env.example` complete and accurate | ✅ Done — audited codebase for hardcoded infra values first (found none), then rewrote `.env.example` fully organized by priority |
| Every service reads from env vars, no hardcoded infra values | ✅ Verified by grep audit — clean |
| WalletConnect (Reown) wallet-side integration | 🆕 Built new this phase — typechecks against the real SDK, but **zero live testing possible** (no relay network access). See `docs/WALLETCONNECT.md` for specific confidence caveats (Solana CAIP-2 chain IDs, tx param parsing) and a testing checklist for once deployed |
| WalletConnect bundle size | ⚠️ Flagged, not resolved — added 641KB gzipped to the server bundle despite client-only dynamic imports; my attempt to fix via Vite SSR externalization didn't work. Build succeeds regardless; worth checking against real Cloudflare Workers limits |
| Supabase integration "ready to connect" | ✅ Unchanged from Phase 8B/9 — typed client, auth service, server functions all real code, still blocked on you applying migrations + supplying `SUPABASE_SERVICE_ROLE_KEY` |
| Blockchain RPC config via env vars | ✅ Unchanged from Phase 8B/9 — already env-gated, re-confirmed clean this phase |
| Storage buckets and policies | ⛔ Not built — this was never implemented in any prior phase (see `docs/CREDENTIALS.md` "What I could NOT prepare for you") |
| RLS with real authenticated users | ⛔ Cannot verify — zero policies exist (unchanged since Phase 8B); nothing to test against even with credentials until policies are written |
| Testnet broadcast/confirmation | ⛔ Cannot verify — no network access; this remains the top risk item from Phase 9's report, unchanged |
| Audit logging / notifications live | ⛔ Cannot verify — code paths exist (`lib/security/audit.ts`, `server/notifications.ts`) and are unchanged from Phase 8B/9, no live exercise possible |
| Ledger consistency after real confirmation | ⛔ Cannot verify beyond Phase 9's local-Postgres proof — that proof still stands (unbalanced entries rejected, atomicity confirmed), but "after real blockchain confirmation" specifically requires a live broadcast, which requires the network access this environment doesn't have |
