# Engineering Log

## 2026-10-14 — QA and wallet-safety work

### Repository and CI
- Repository: RoyalFinTech/Royal_Chain_Wallet.
- Working branch: `security/tx-hardening-2026-10-14`. Main was not directly changed.
- Draft PR #1 remains open and unmerged: https://github.com/RoyalFinTech/Royal_Chain_Wallet/pull/1.
- Added GitHub Actions workflow `.github/workflows/qa.yml` for typecheck, tests, lint and production build.
- Initial `npm ci` failed because the committed lockfile missed `lru-cache@11.5.3`. CI synchronized it in commit `c45d092`.
- Checked run at commit `23ee0ebe5b0947992cdffcce9a60f9173ffab27f` passed install, TypeScript typecheck, unit tests, lint and production build. This is CI verification, not a live integration or security certification. Subsequent environment-file hygiene, Render config and engineering-log commits triggered newer runs; latest head `082f703f2ddc8643cdc08174f6ef8a202bf945ec` was pending at the last check and must be green before claiming current-head verification.
- CI run: https://github.com/RoyalFinTech/Royal_Chain_Wallet/actions/runs/38592625049.

### Wallet recovery and WalletConnect
- Wallet creation preview now derives a fresh BIP-39 phrase and addresses in memory rather than saving a preview wallet under a known PIN; persistence waits for a confirmed user PIN.
- Phrase restore validates the mnemonic and waits for the user to choose/confirm a PIN. Partial word suggestions were replaced with the BIP-39 English list.
- Added tests for unique valid 12-word phrases, valid 24-word phrases and recovery-word hints.
- Mock encrypted-backup/private-key restore paths are disabled rather than pretending to restore a wallet.
- WalletConnect now scans with browser `BarcodeDetector` when available and offers manual URI entry as fallback. It only exposes message-signing methods; transaction and typed-data signing are intentionally disabled pending protocol-correct implementation.
- The WalletConnect review screen displays the requested message and signer and rejects unreadable/over-limit payloads or signer-address mismatch. It has not yet been tested against a controlled live dApp/relay.
- General QR payment simulation was removed. Real receive QR encoding still needs implementation.

### Supabase workspace
- Found active project **Royal Chain Wallet**, project ref `jnehlnifltckcfecjhhf`, in **Royal FinTech Company**, region `eu-west-3` (Paris). A new Supabase project is not needed.
- Live migration history lists versions 1–10, while checked-in SQL source only contains migrations 1–4. Proposed migration #11 exists on this branch only.
- Read-only inspection observed zero rows in `public.users`, `public.wallets` and `public.transactions` at the time checked.
- Live `check_rate_limit(text,integer,integer)` is SECURITY DEFINER and executable by `anon` and `authenticated`, with caller-controlled bucket/quota/window inputs. Proposed #11 narrows the intended authenticated bucket and rate-limit parameters; it has not been applied.
- Live `record_transaction_with_ledger(...)` denies EXECUTE to `authenticated` and `anon`, while application code currently calls it using an authenticated client. A trusted invocation design must be proven before any live grant change.
- Supabase advisors reported six authenticated-callable SECURITY DEFINER helper functions, 13 unindexed foreign keys and four RLS auth-init-plan warnings. Review each individually; do not apply blanket changes.
- No live database migration or data mutation was performed.

### Render preview
- Created service `royal-chain-wallet-preview` in **Royal's workspace** (`tea-dadvf02d0e5s73eha320`), service ID `srv-db7qlrbrjlhs73cm4ppg`.
- Preview URL: https://royal-chain-wallet-preview.onrender.com.
- Render dashboard: https://dashboard.render.com/web/srv-db7qlrbrjlhs73cm4ppg.
- Branch: `security/tx-hardening-2026-10-14`; build command `npm ci && npm run build`; start command `npm start`; Node runtime, Frankfurt region, free plan.
- Initial deployment `dep-db7qlrrrjlhs73cm4sug` succeeded and is live on the initial blueprint commit. Render build logs show `npm run build` succeeded and `npm start` launched `.output/server/index.mjs`, listening on port 10000. A later documentation commit triggered deployment `dep-db7qm586v3gs73etbe9g`, which was still building at the last check. The public URL is recorded above; an independent HTTP smoke request could not be made from this execution environment because outbound DNS/network access was unavailable.
- Only public Supabase URL/project ref/publishable key are configured as preview variables. No service-role key or wallet secret was supplied or stored.
- Existing unrelated Render services were left unchanged.

### Repository environment-file hygiene
- The tracked restore-archive file `_restore/royal-chain-hub-main/.env` was removed from the current branch and `.gitignore` now ignores `.env` and `.env.*` while allowing `.env.example`.
- Inspected file contained Supabase URL, project ID and publishable/anon key configuration only; no service-role key was found in that file. Removal does not erase historical Git versions, so if a real secret is ever found in history, rotate it.

## Remaining blockers / next work
1. Recover exact SQL sources for applied migrations #5–#10, compare with live schema/policies/functions/grants, and test a clean reset before reviewing migration #11. Do not apply it to production yet.
2. Add disposable-database integration tests for cross-user wallet/transaction/ledger access, malformed entries, atomic rollback and concurrent rate limits.
3. Verify wallet create/abandon, PIN mismatch, valid/invalid 12- and 24-word recovery, and successful unlock after restore.
4. Validate WalletConnect message encoding and signer address against the supported EVM/Solana adapters; pair with a controlled dApp. Keep transaction signing disabled until implemented and tested.
5. Confirm Render deployment succeeds, then test root page, server functions, auth, scanner/manual URI fallback, and logs.
6. Audit all remaining demo identity/data consumers. Wallet/account creation still makes separate database requests and may leave an orphan wallet if account creation fails.
7. Do not describe this as production-ready until all applicable integration and security gates pass.

## 2026-10-14 — Follow-up from user-observed production-preview failure

### Reproduction evidence
- User supplied a screenshot from `/create-wallet`: phrase/address generation fails, the UI remains on a “Generating…” status with a generic error and disabled Continue button.
- Trace of `src/routes/create-wallet.tsx` shows generation calls `generateMnemonic(128)` then `deriveAllChains()`; its catch hides the underlying cause from the user.
- `src/lib/wallet/derive.ts` uses the global Node-style `Buffer` in Bitcoin and Solana key derivation. `src/routes/__root.tsx` installs `Buffer` only from a root React `useEffect`, which can run after child-route passive effects; generation therefore has an ordering dependency. Planned fix: directly import `Buffer` from the browser-compatible `buffer` package in modules that use it and add a retry/error UI.
- Logo root cause confirmed in `src/assets/royal-chain-logo.png.asset.json`: image URL points to `/__l5e/assets-v1/...`, an internal asset route not served by the Render deployment. Planned fix: add a repository-owned SVG at `public/royal-chain-wallet-logo.svg` and have the shared `Logo` component use it.
- Onboarding currently claims biometric protection, 24/7 fraud monitoring, instant QR payments, and multi-currency holdings including fiat. Those capabilities are not backed by reviewed live integrations and do not accurately describe the current multi-chain crypto wallet. Planned fix: rewrite the slides to accurately describe self-custody, recovery phrase/PIN, and supported networks.
- Transfer route check found `transactionService.submitTransfer` fabricates a random hash and a “confirmed” record when the chain is not configured or when no native-chain mnemonic is supplied. This is a critical correctness/safety defect. Planned fix: fail closed with a clear configuration/unsupported-asset error instead of simulating payment success.
- Royal token readiness check: `src/lib/services/tokenService.ts` explicitly returns deterministic mock balances; Admin Token UI contains static supply/holder/volume numbers and Mint/Burn buttons without handlers; the contract/mint registry points at environment variables and no live mint address/program is configured in the preview service. Royal Token is therefore **not ready to mint or transfer**.
- Swap flow check found `getSwapQuote` uses hard-coded price constants and “Confirm Swap” waits and returns success without on-chain routing. Planned fix: mark the quote as a demo estimate and prevent a fake swap from showing as complete until a real route/transaction integration exists.
- WalletConnect transaction signing stays disabled; no real dApp relay test has been run.
- Latest CI run for pre-follow-up commit `2b7305a566518a3d1a3d91942881670a33020346` passed typecheck, tests, lint and build: https://github.com/RoyalFinTech/Royal_Chain_Wallet/actions/runs/38596973005. This result predates the fixes planned below.
- Render preview service is live at https://royal-chain-wallet-preview.onrender.com. Previous deployment build and server startup succeeded. The next source commits will trigger deployments automatically.

## 2026-10-14 — Implementation results after screenshot-driven audit

### Implemented on this branch
- Fixed the wallet-creation derivation dependency by importing browser `Buffer` directly and installing the global buffer synchronously before browser HD/key derivation runs. The create-wallet route validates the BIP-39 phrase and address outputs, logs a sanitized failure cause (never phrase/key material), and provides a retry button.
- Replaced the proxy-hosted logo URL with a repository-owned `public/royal-chain-wallet-logo.svg`; shared wordmark and app footer use the common logo component. Onboarding was rewritten for a self-custody multi-chain crypto wallet and uses real photographic imagery rather than promises of fiat, biometrics, fraud monitoring or instant payment rails that aren't implemented.
- Replaced decorative fake QR blocks with actual QR encoding of the selected local wallet address. Copy/share/save controls perform browser actions. WalletConnect scanning reads a dApp URI only; it is not a payment confirmation.
- Removed fake success/fabricated hashes for unconfigured native sends and unsupported SPL-token transfers. Chain signing now checks positive finite amounts, recipient format and that the derived sender address matches the local wallet. If confirmation polling times out after a broadcast, the UI preserves the hash and asks the user to inspect the explorer rather than implying the funds never left.
- Removed generated balances and transaction/NFT history from the dashboard/activity pages; native assets show zero or an unconnected state when RPCs are absent. Dashboard trend values, USD prices and portfolio estimates are explicitly marked as sample values.
- Swap now remains a preview, with live routing disabled; fiat exchange, fiat deposits, staking, NFT transfer, ROY mint/burn and fake admin screens are disabled instead of reporting a successful operation without an on-chain transaction.
- Profile now lists the actual local Bitcoin/Ethereum/BNB/Solana public addresses and their copy actions. The legacy wallet/fiat pages and security/alerts pages no longer fabricate a member identity, fiat pockets, devices, logins, price alerts or security history.
- Notifications controls are labeled as local preview preferences; push/email delivery and persistence remain unimplemented.
- Native-chain crypto asset page is now distinct from the removed fiat wallet view. ROY/USDT/USDC balances are empty/not-connected until a real SPL reader and verified mints exist.
- Proposed migration 11 was hardened in source to limit authoritative ledger posting to `service_role`, require a verified tx hash and confirmed status, and introduce an atomic wallet/account creation RPC. The authenticated browser-facing transaction-record endpoint now fails closed pending a real server-side chain verifier. The wallet server function uses the new atomic RPC.

### Verification boundaries and open defects
- No migration was applied to Supabase. The project history reports versions 1–10 while repository SQL source for versions 5–10 is missing. Recover and reconcile those migrations before considering proposed migration 11.
- No on-chain testnet broadcast, real WalletConnect relay/dApp test, or real merchant checkout has been performed. RPCs, live price feed, SPL token readers/transfers, on-chain ROY mint and audited mint authority, swaps, stake program, NFT indexer, notification delivery, and merchant API/authentication remain unimplemented.
- A merchant API key was not generated; a usable key requires server-side merchant auth, scoped credentials, hashed-at-rest storage, revocation/rotation, idempotency/replay handling, audit logging and verified payment callbacks.
- The new source has had CI runs triggered, but the current-head CI run must complete green after formatting before claiming a passing current-head build. The latest Render deploy must also finish and the preview must be smoke-tested in a browser; previous successful deploys do not verify the newest source.
- User balances and transaction history should not be taken as production facts. The dashboard labels estimated USD/trend figures as illustrative; a trusted live pricing provider and chain indexer are still required.
